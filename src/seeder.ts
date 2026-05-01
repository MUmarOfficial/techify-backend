import bcrypt from 'bcryptjs';
import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';

import { ENV } from './config/env.js';
import { Course } from './models/Course.model.js';
import { Enrollment } from './models/Enrollment.model.js';
import { Lesson } from './models/Lesson.model.js';
import { User } from './models/User.model.js';
import { Category } from './models/Category.model.js';
import { log } from './utils/logger.js';

export const seedData = async (isAuto = false) => {
  try {
    const mongoUri = ENV.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is undefined in environment variables.');
    }

    if (mongoose.connection.readyState !== mongoose.STATES.connected) {
      log.info('Connecting to MongoDB specifically for seeding mass data...');
      await mongoose.connect(mongoUri);
    }

    log.info('Wiping out existing database data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await Category.deleteMany({});

    log.info('Generating 2 Admins, 5 Instructors, and 10 Students...');
    
    // Hash password beforehand because insertMany bypasses Mongoose pre-save hooks
    // We will use 'Admin@123' for the admin to match Postman, and 'Password@123' for others
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const regularPassword = await bcrypt.hash('Password@123', 10);
    
    // Create Admins
    const admins = [];
    for (let i = 1; i <= 2; i++) {
      admins.push({
        name: `System Admin ${i}`,
        email: i === 1 ? 'admin@techify.com' : `admin${i}@techify.com`,
        password: adminPassword,
        role: 'admin',
      });
    }
    await User.insertMany(admins);

    // Create Instructors
    const instructorsData = [];
    for (let i = 1; i <= 5; i++) {
        instructorsData.push({
        name: `Instructor ${i}`,
        email: i === 1 ? 'instructor@techify.com' : `instructor${i}@techify.com`,
        password: regularPassword,
        role: 'instructor',
      });
    }
    const instructors = await User.insertMany(instructorsData);

    // Create Students
    const studentsData = [];
    for (let i = 1; i <= 10; i++) {
        studentsData.push({
        name: `Student ${i}`,
        email: i === 1 ? 'student@techify.com' : `student${i}@techify.com`,
        password: regularPassword,
        role: 'student',
      });
    }
    const students = await User.insertMany(studentsData);

    log.info('Generating 5 Categories...');
    const categoriesNames = ['Full Stack DevOps', 'Data Science', 'AI', 'Design', 'Cybersecurity'];
    const categoriesData = categoriesNames.map(name => ({ name }));
    await Category.insertMany(categoriesData);

    log.info('Generating 20 Realistic Tech Courses...');
    const coursesData = [];
    const courseTitles = [
      "Mastering React Desktop Apps with Electron",
      "Complete Node.js Backend Engineering",
      "GoLang for Scalable Microservices",
      "Advanced CSS & Tailwind Animations",
      "Kubernetes & Docker Deployment Pipelines",
      "Python Data Science & Machine Learning",
      "Full-Stack Next.js 14 E-commerce",
      "AWS Certified Solutions Architect",
      "GraphQL APIs with Apollo Server",
      "Rust Language for Systems Programming",
      "Frontend Automation Testing with Cypress",
      "Deep Learning with TensorFlow",
      "Vue 3 & Nuxt.js Ecosystem",
      "SvelteKit High Performance Web Patterns",
      "Web3 & Solidity Smart Contracts",
      "Advanced PostgreSQL Database Design",
      "C# & .NET Core Enterprise Apps",
      "Flutter Cross-Platform App Development",
      "React Native CLI for iOS and Android",
      "Cybersecurity & Penetration Testing Basics"
    ];

    const thumbnails = [
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
      'https://images.unsplash.com/photo-1667372393086-9d4001d4d732',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
    ];

    for (let i = 0; i < 20; i++) {
      const assignedInstructor = instructors[Math.floor(Math.random() * instructors.length)];
      coursesData.push({
        title: courseTitles[i],
        description: `This is the comprehensive deep dive into ${courseTitles[i]}. Master the fundamentals to advanced, modern techniques utilized by top tech companies globally.`,
        instructor: assignedInstructor._id,
        category: categoriesNames[i % categoriesNames.length],
        price: Math.floor(Math.random() * 150) + 20.99,
        thumbnail: thumbnails[i % thumbnails.length]
      });
    }
    const courses = await Course.insertMany(coursesData);

    log.info('Generating Contextual Lessons with YouTube Links for Each Course...');
    const lessonPrefixes = [
      "Introduction to",
      "Setting up the Environment for",
      "Core Fundamentals of",
      "Advanced Architecture in",
      "State Management & Logic for",
      "Building a Real-World Project with",
      "Testing and Debugging",
      "Performance Optimization for",
      "Deployment Pipelines for",
      "Final Review & Certification in"
    ];

    // Some tech related youtube videos
    const youtubeLinks = [
      "https://www.youtube.com/watch?v=aircAruvnKk", // Neural Networks
      "https://www.youtube.com/watch?v=zjkBMFhNj_g", // LLM tutorial
      "https://www.youtube.com/watch?v=SqcY0GlETPk", // React in 100 seconds
      "https://www.youtube.com/watch?v=ENrzD9HAZK4", // Nodejs in 100 seconds
      "https://www.youtube.com/watch?v=IHZwWFHWa-w", // Python in 100 seconds
    ];

    const lessonsData = [];
    for (const course of courses) {
      for (let i = 0; i < 10; i++) {
        lessonsData.push({
          title: `${lessonPrefixes[i]} ${course.title.split(' ')[0]}`,
          content: `In this module: "${lessonPrefixes[i]}", we will explore deep architectural patterns and methodologies specifically tailored to ${course.title}. This content is extremely rich and structured for maximum retention.`,
          course: course._id,
          order: i + 1,
          videoUrl: youtubeLinks[i % youtubeLinks.length] // YouTube link here!
        });
      }
    }
    await Lesson.insertMany(lessonsData);

    log.info('Generating Random Enrollments for Students...');
    const enrollmentsData = [];
    for (const student of students) {
        // Enroll each student in exactly 2 random courses
        const randomCourse1 = courses[Math.floor(Math.random() * courses.length)];
        let randomCourse2 = courses[Math.floor(Math.random() * courses.length)];
        while (randomCourse2._id.toString() === randomCourse1._id.toString()) {
             randomCourse2 = courses[Math.floor(Math.random() * courses.length)];
        }

        enrollmentsData.push({
            student: student._id,
            course: randomCourse1._id,
            progress: Math.floor(Math.random() * 100)
        }, {
            student: student._id,
            course: randomCourse2._id,
            progress: Math.floor(Math.random() * 100)
        });
    }
    await Enrollment.insertMany(enrollmentsData);

    log.info('✅ Mass Data Seed Completed Successfully!');
    log.info('----------------------------------------------');
    log.info(`🔑 Mass Login Testing Data (Matches Postman Collection):`);
    log.info(` Admin:       admin@techify.com      (Password: Admin@123)`);
    log.info(` Instructor:  instructor@techify.com (Password: Password@123)`);
    log.info(` Student:     student@techify.com    (Password: Password@123)`);
    log.info('----------------------------------------------');

    if (!isAuto) {
      process.exit(0);
    }
  } catch (error) {
    log.err('Seeding failed miserably', error);
    if (!isAuto) {
      process.exit(1);
    }
  }
};

// If this file is run directly (e.g. `npm run seed`)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void seedData(false);
}
