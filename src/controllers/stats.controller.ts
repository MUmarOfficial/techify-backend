import { Request, Response } from 'express';
import { Document, Model } from 'mongoose';

import { Course } from '../models/Course.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAdminStats = asyncHandler(
  async (req: Request, res: Response) => {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalInstructors = await User.countDocuments({ role: 'instructor' });

    // Calculate trends
    const getTrendData = async (
      model: Model<Document>,
      filter: Record<string, unknown> = {},
    ): Promise<{ trend: 'up' | 'down'; change: string }> => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthCount = await model.countDocuments({
        ...filter,
        createdAt: { $gte: startOfThisMonth },
      });

      const lastMonthCount = await model.countDocuments({
        ...filter,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

      let changePercent = 0;
      if (lastMonthCount > 0) {
        changePercent =
          ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      } else if (thisMonthCount > 0) {
        changePercent = 100;
      }

      return {
        trend: changePercent >= 0 ? 'up' : 'down',
        change: `${changePercent >= 0 ? '+' : ''}${Math.round(Math.abs(changePercent))}%`,
      };
    };

    const userTrend = await getTrendData(User as unknown as Model<Document>);
    const courseTrend = await getTrendData(
      Course as unknown as Model<Document>,
    );
    const enrollmentTrend = await getTrendData(
      Enrollment as unknown as Model<Document>,
    );
    const instructorTrend = await getTrendData(
      User as unknown as Model<Document>,
      { role: 'instructor' },
    );

    // For recent activity, fetch latest 5 users and latest 5 courses
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt');
    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt');

    const recentActivity = [
      ...recentUsers.map((u) => ({
        id: `user-${String(u._id)}`,
        action: `New ${u.role} registered: ${u.name}`,
        time: u.createdAt,
      })),
      ...recentCourses.map((c) => ({
        id: `course-${String(c._id)}`,
        action: `New course "${c.title}" created`,
        time: c.createdAt,
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        action: item.action,
        time: item.time.toISOString(),
      }));

    // Enrollments by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    interface EnrollmentMonthStat {
      _id: { month: number; year: number };
      count: number;
    }

    const enrollmentsByMonth = await Enrollment.aggregate<EnrollmentMonthStat>([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Category distribution
    const categoryDistribution = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          label: '$_id',
          value: {
            $multiply: [{ $divide: ['$count', totalCourses || 1] }, 100],
          },
          _id: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: { value: totalUsers, ...userTrend },
        totalCourses: { value: totalCourses, ...courseTrend },
        totalEnrollments: { value: totalEnrollments, ...enrollmentTrend },
        totalInstructors: { value: totalInstructors, ...instructorTrend },
        recentActivity,
        enrollmentsByMonth: enrollmentsByMonth.map((item) => ({
          label: new Date(item._id.year, item._id.month - 1).toLocaleString(
            'default',
            { month: 'short' },
          ),
          value: item.count,
        })),
        categoryDistribution,
      },
    });
  },
);

export const getInstructorStats = asyncHandler(
  async (req: Request, res: Response) => {
    const instructorId = req.user?._id;

    const courses = await Course.find({ instructor: instructorId });
    const totalCourses = courses.length;
    const courseIds = courses.map((c) => c._id);

    const totalStudents = await Enrollment.countDocuments({
      course: { $in: courseIds },
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
      },
    });
  },
);

export const getStudentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = req.user?._id;

    const enrolledCourses = await Enrollment.countDocuments({
      student: studentId,
    });
    const completedCourses = await Enrollment.countDocuments({
      student: studentId,
      progress: 100,
    });
    const inProgressCourses = await Enrollment.countDocuments({
      student: studentId,
      progress: { $lt: 100 },
    });

    res.status(200).json({
      success: true,
      data: {
        enrolledCourses,
        completedCourses,
        inProgressCourses,
      },
    });
  },
);
