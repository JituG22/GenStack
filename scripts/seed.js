#!/usr/bin/env node

require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/genstack';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      await mongoose.connection.db.dropDatabase();
      console.log('🗑️  Cleared existing database');
    }

    // Sample organizations
    const organizations = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'GenStack Demo Org',
        description: 'Demo organization for GenStack',
        owner: new mongoose.Types.ObjectId(),
        members: [],
        projects: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample users
    const users = [
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'admin@genstack.io',
        firstName: 'Admin',
        lastName: 'User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LebtcZHqkxNzDRAhK', // password: admin123
        role: 'admin',
        organization: organizations[0]._id,
        projects: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'developer@genstack.io',
        firstName: 'Developer',
        lastName: 'User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LebtcZHqkxNzDRAhK', // password: admin123
        role: 'developer',
        organization: organizations[0]._id,
        projects: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Update organization with users
    organizations[0].owner = users[0]._id;
    organizations[0].members = users.map(u => u._id);

    // Sample projects
    const projects = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Demo E-commerce App',
        description: 'Sample e-commerce application built with GenStack',
        organization: organizations[0]._id,
        members: [
          {
            userId: users[0]._id,
            role: 'admin',
            joinedAt: new Date()
          },
          {
            userId: users[1]._id,
            role: 'editor',
            joinedAt: new Date()
          }
        ],
        nodes: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample nodes
    const nodes = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'User Login Component',
        type: 'react',
        template: `import React, { useState } from 'react';

const {{componentName}} = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic
    console.log('Login:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>{{title}}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{{buttonText}}</button>
    </form>
  );
};

export default {{componentName}};`,
        properties: {
          componentName: 'LoginForm',
          title: 'Login to Your Account',
          buttonText: 'Sign In'
        },
        validations: [
          {
            field: 'componentName',
            rule: 'required',
            message: 'Component name is required'
          }
        ],
        metadata: {
          category: 'authentication',
          description: 'A reusable login form component',
          version: '1.0.0',
          author: users[1]._id,
          tags: ['react', 'authentication', 'form'],
          icon: 'login'
        },
        projectId: projects[0]._id,
        position: { x: 100, y: 100 },
        connections: [],
        isTemplate: false,
        createdBy: users[1]._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert data
    await mongoose.connection.collection('organizations').insertMany(organizations);
    console.log('✅ Seeded organizations');

    await mongoose.connection.collection('users').insertMany(users);
    console.log('✅ Seeded users');

    await mongoose.connection.collection('projects').insertMany(projects);
    console.log('✅ Seeded projects');

    await mongoose.connection.collection('nodes').insertMany(nodes);
    console.log('✅ Seeded nodes');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample accounts:');
    console.log('Admin: admin@genstack.io / admin123');
    console.log('Developer: developer@genstack.io / admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedData();
