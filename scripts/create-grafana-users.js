#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load demo users
const demoUsersPath = path.join(__dirname, '../data/demo-users.json');
const demoUsers = JSON.parse(fs.readFileSync(demoUsersPath, 'utf8'));

const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000';
const GRAFANA_ADMIN_USER = process.env.GRAFANA_ADMIN_USER || 'admin';
const GRAFANA_ADMIN_PASSWORD = process.env.GRAFANA_ADMIN_PASSWORD || 'password';

const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  auth: {
    username: GRAFANA_ADMIN_USER,
    password: GRAFANA_ADMIN_PASSWORD,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

async function createUsers() {
  console.log('🚀 Creating users in Grafana...');
  
  for (const user of demoUsers.users) {
    if (user.role === 'superadmin') {
      console.log(`⏭️  Skipping superadmin user: ${user.email}`);
      continue;
    }
    
    try {
      console.log(`👤 Creating user: ${user.email}`);
      
      const userData = {
        name: user.email.split('@')[0], // Use email prefix as name
        email: user.email,
        login: user.email,
        password: user.password,
        orgId: 1, // Default organization
      };
      
      const response = await grafanaClient.post('/api/admin/users', userData);
      console.log(`✅ Created user: ${user.email} (ID: ${response.data.id})`);
      
      // Create organization for IRCTC users
      if (user.organization === 'IRCTC') {
        try {
          console.log(`🏢 Creating organization: ${user.organization}`);
          const orgResponse = await grafanaClient.post('/api/orgs', {
            name: user.organization
          });
          console.log(`✅ Created organization: ${user.organization} (ID: ${orgResponse.data.orgId})`);
          
          // Add user to organization
          await grafanaClient.post(`/api/orgs/${orgResponse.data.orgId}/users`, {
            loginOrEmail: user.email,
            role: 'Admin'
          });
          console.log(`✅ Added ${user.email} to ${user.organization} organization`);
          
        } catch (orgError) {
          console.log(`⚠️  Organization ${user.organization} might already exist or error occurred:`, orgError.response?.data?.message || orgError.message);
        }
      }
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️  User ${user.email} already exists`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.response?.data?.message || error.message);
      }
    }
  }
  
  console.log('🎉 User creation process completed!');
}

// Run the script
createUsers().catch(console.error);
