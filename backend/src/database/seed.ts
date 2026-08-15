import bcrypt from 'bcryptjs';
import { prisma } from './client';
import { config } from '../config/env';
import { SEEDED_THEMES } from '../services/theme.service';
import { Role } from '@prisma/client';

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Themes
  console.log('🎨 Seeding 20 Profession-Specific Portfolio Themes...');
  for (const theme of SEEDED_THEMES) {
    await prisma.portfolioTheme.upsert({
      where: { themeId: theme.themeId },
      update: theme,
      create: theme,
    });
  }

  const hashedPassword = await bcrypt.hash(config.superAdmin.password, 12);

  // 2. Seed Super Admin User
  console.log('👑 Seeding Super Admin User...');
  const superAdmin = await prisma.user.upsert({
    where: { email: config.superAdmin.email },
    update: {
      fullName: config.superAdmin.name,
      role: Role.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: config.superAdmin.name,
      email: config.superAdmin.email,
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
      desiredProfession: 'Platform Administrator',
    },
  });

  // Subdomain for Super Admin
  await prisma.subdomain.upsert({
    where: { slug: 'superadmin' },
    update: { userId: superAdmin.id, isPrimary: true },
    create: {
      userId: superAdmin.id,
      slug: 'superadmin',
      isPrimary: true,
    },
  });

  // Profile for Super Admin
  const superAdminProfile = await prisma.profile.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      title: 'Chief Platform Director & Enterprise Architect',
      headline: 'Overseeing Multi-Tenant SaaS Architecture & Global Platform Infrastructure',
      summary: 'Enterprise platform leader with 10+ years of experience directing high-availability cloud infrastructure, distributed microservices, multi-tenant database isolation, and security compliance.',
      careerObjective: 'To build secure, resilient, enterprise-scale software platforms that empower thousands of global tenants.',
      bio: 'Super Admin leads the technical infrastructure and core governance for the Multi-Tenant Portfolio SaaS Platform.',
      phone: '+1 (555) 019-2831',
      location: 'San Francisco, CA',
      website: 'https://myportfolio.com',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      completenessScore: 100,
      isPublicEmail: true,
      isPublicPhone: true,
      isPublicLocation: true,
    },
  });

  // Super Admin Portfolio Status
  await prisma.portfolioStatus.upsert({
    where: { profileId: superAdminProfile.id },
    update: { isPublished: true, publishStatus: 'PUBLISHED' },
    create: {
      profileId: superAdminProfile.id,
      isPublished: true,
      publishStatus: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Super Admin Portfolio Customization
  await prisma.portfolioCustomization.upsert({
    where: { profileId: superAdminProfile.id },
    update: { themeId: 'cybersecurity' },
    create: {
      profileId: superAdminProfile.id,
      themeId: 'cybersecurity',
      fontHeading: 'Fira Code',
      fontBody: 'Fira Code',
      showQrInPdf: true,
      showSocialLinks: true,
    },
  });

  // Clear existing Super Admin nested items
  await prisma.experience.deleteMany({ where: { profileId: superAdminProfile.id } });
  await prisma.education.deleteMany({ where: { profileId: superAdminProfile.id } });
  await prisma.skill.deleteMany({ where: { profileId: superAdminProfile.id } });
  await prisma.project.deleteMany({ where: { profileId: superAdminProfile.id } });
  await prisma.certification.deleteMany({ where: { profileId: superAdminProfile.id } });

  // Super Admin Content
  await prisma.experience.createMany({
    data: [
      {
        profileId: superAdminProfile.id,
        company: 'Portfolio SaaS Inc.',
        position: 'Chief Technology Officer & Platform Lead',
        location: 'San Francisco, CA',
        startDate: '2021-01',
        endDate: 'Present',
        isCurrent: true,
        description: 'Directing core platform engineering, multi-tenant data isolation, and global security policies.',
        responsibilities: [
          'Architected global multi-tenant cluster serving 100,000+ portfolio requests daily.',
          'Enforced zero-trust RBAC and Redis rate limiting to safeguard against DDoS attacks.',
        ],
        achievements: ['Maintained 99.99% system uptime over 3 consecutive years'],
        orderIndex: 1,
      },
    ],
  });

  await prisma.education.createMany({
    data: [
      {
        profileId: superAdminProfile.id,
        institution: 'Massachusetts Institute of Technology (MIT)',
        qualification: 'Master of Science',
        field: 'Distributed Systems & Computer Science',
        startDate: '2014-09',
        endDate: '2018-05',
        grade: 'High Distinction',
        description: 'Specialized in high-throughput distributed databases and cloud system architecture.',
        orderIndex: 1,
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { profileId: superAdminProfile.id, name: 'Multi-Tenant SaaS Architecture', category: 'Technical', proficiency: 98, level: 'Expert', orderIndex: 1 },
      { profileId: superAdminProfile.id, name: 'Kubernetes & Docker Security', category: 'Technical', proficiency: 95, level: 'Expert', orderIndex: 2 },
      { profileId: superAdminProfile.id, name: 'PostgreSQL Database Tuning', category: 'Technical', proficiency: 94, level: 'Expert', orderIndex: 3 },
    ],
  });

  await prisma.project.createMany({
    data: [
      {
        profileId: superAdminProfile.id,
        title: 'Enterprise Multi-Tenant Infrastructure Engine',
        description: 'Core engine handling tenant isolation, dynamic subdomain routing, and automated SSL provisioning.',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        demoUrl: 'https://superadmin.myportfolio.com',
        githubUrl: 'https://github.com',
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        featured: true,
        orderIndex: 1,
      },
    ],
  });

  await prisma.certification.createMany({
    data: [
      {
        profileId: superAdminProfile.id,
        name: 'AWS Certified Solutions Architect – Professional',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2021-08',
        credentialId: 'AWS-SAP-99104',
        orderIndex: 1,
      },
    ],
  });

  // 3. Seed Test Admin (Francis Mwangi)
  console.log('👤 Seeding Test Admin (Francis Mwangi)...');
  const testAdminPassword = await bcrypt.hash(config.testAdmin.password, 12);

  const testAdmin = await prisma.user.upsert({
    where: { email: config.testAdmin.email },
    update: {
      fullName: config.testAdmin.name,
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: config.testAdmin.name,
      email: config.testAdmin.email,
      password: testAdminPassword,
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
      desiredProfession: config.testAdmin.profession,
    },
  });

  // Subdomain for Francis
  await prisma.subdomain.upsert({
    where: { slug: config.testAdmin.subdomain },
    update: { userId: testAdmin.id, isPrimary: true },
    create: {
      userId: testAdmin.id,
      slug: config.testAdmin.subdomain,
      isPrimary: true,
    },
  });

  // Profile for Francis
  const profile = await prisma.profile.upsert({
    where: { userId: testAdmin.id },
    update: {},
    create: {
      userId: testAdmin.id,
      title: 'Senior Software Architect & Full-Stack Engineer',
      headline: 'Architecting High-Performance Multi-Tenant SaaS Platforms & Enterprise Solutions',
      summary: 'Passionate Senior Software Architect with 7+ years of expertise in TypeScript, React, Node.js, PostgreSQL, Docker, and Cloud Infrastructure. Proven track record of scaling high-throughput applications and leading cross-functional engineering teams.',
      careerObjective: 'To build resilient, user-centric software products that empower businesses and scale effortlessly.',
      bio: 'Francis Mwangi is an accomplished software architect based in Nairobi, Kenya. He specializes in designing modern cloud-native systems, event-driven architectures, and slick micro-frontend user interfaces.',
      phone: '+254 700 123 456',
      location: 'Nairobi, Kenya',
      website: 'https://francismwangi.dev',
      github: 'https://github.com/francismwangi',
      linkedin: 'https://linkedin.com/in/francismwangi',
      twitter: 'https://twitter.com/francismwangi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      completenessScore: 95,
      isPublicEmail: true,
      isPublicPhone: true,
      isPublicLocation: true,
    },
  });

  // Portfolio Status
  await prisma.portfolioStatus.upsert({
    where: { profileId: profile.id },
    update: { isPublished: true, publishStatus: 'PUBLISHED' },
    create: {
      profileId: profile.id,
      isPublished: true,
      publishStatus: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  // Portfolio Customization
  await prisma.portfolioCustomization.upsert({
    where: { profileId: profile.id },
    update: { themeId: 'software-engineer' },
    create: {
      profileId: profile.id,
      themeId: 'software-engineer',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      showQrInPdf: true,
      showSocialLinks: true,
    },
  });

  // Clear existing nested items to avoid duplicates on re-seed
  await prisma.experience.deleteMany({ where: { profileId: profile.id } });
  await prisma.education.deleteMany({ where: { profileId: profile.id } });
  await prisma.skill.deleteMany({ where: { profileId: profile.id } });
  await prisma.project.deleteMany({ where: { profileId: profile.id } });
  await prisma.certification.deleteMany({ where: { profileId: profile.id } });
  await prisma.review.deleteMany({ where: { profileId: profile.id } });
  await prisma.contactMessage.deleteMany({ where: { profileId: profile.id } });

  // Experiences
  console.log('💼 Seeding Experiences for Test Admin...');
  await prisma.experience.createMany({
    data: [
      {
        profileId: profile.id,
        company: 'CloudScale Technologies',
        position: 'Lead Software Architect',
        location: 'Nairobi, Kenya',
        startDate: '2022-01',
        endDate: 'Present',
        isCurrent: true,
        description: 'Directing technical strategy and multi-tenant cloud architecture for fintech and SaaS platforms.',
        responsibilities: [
          'Architected multi-tenant SaaS platform handling 50,000+ active subscriptions.',
          'Reduced AWS cloud compute costs by 35% through Redis caching and container optimization.',
          'Spearheaded transition to TypeScript, Next.js, and automated CI/CD pipelines.',
        ],
        achievements: ['Awarded Technical Innovator of the Year 2023'],
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        company: 'Apex Digital Solutions',
        position: 'Senior Full-Stack Developer',
        location: 'Remote',
        startDate: '2019-06',
        endDate: '2021-12',
        isCurrent: false,
        description: 'Engineered high-performance web applications using React, Express, PostgreSQL, and GraphQL.',
        responsibilities: [
          'Developed micro-frontend architecture for core user dashboard.',
          'Implemented OAuth2 / JWT authentication with strict role-based access control.',
        ],
        achievements: ['Delivered 12 client projects on schedule with zero critical post-release bugs'],
        orderIndex: 2,
      },
    ],
  });

  // Education
  console.log('🎓 Seeding Education for Test Admin...');
  await prisma.education.createMany({
    data: [
      {
        profileId: profile.id,
        institution: 'University of Nairobi',
        qualification: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2015-09',
        endDate: '2019-05',
        grade: 'First Class Honors',
        description: 'Focused on algorithms, software engineering principles, and distributed systems.',
        orderIndex: 1,
      },
    ],
  });

  // Skills
  console.log('⚡ Seeding Skills for Test Admin...');
  await prisma.skill.createMany({
    data: [
      { profileId: profile.id, name: 'TypeScript', category: 'Technical', proficiency: 95, level: 'Expert', orderIndex: 1 },
      { profileId: profile.id, name: 'React / Next.js', category: 'Technical', proficiency: 92, level: 'Expert', orderIndex: 2 },
      { profileId: profile.id, name: 'Node.js / Express', category: 'Technical', proficiency: 90, level: 'Expert', orderIndex: 3 },
      { profileId: profile.id, name: 'PostgreSQL / Prisma', category: 'Technical', proficiency: 88, level: 'Expert', orderIndex: 4 },
      { profileId: profile.id, name: 'Docker / Nginx', category: 'Technical', proficiency: 85, level: 'Intermediate', orderIndex: 5 },
      { profileId: profile.id, name: 'System Architecture', category: 'Industry', proficiency: 92, level: 'Expert', orderIndex: 6 },
    ],
  });

  // Projects
  console.log('🚀 Seeding Projects for Test Admin...');
  await prisma.project.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Multi-Tenant Portfolio & CV SaaS Platform',
        description: 'Complete SaaS platform supporting 20 profession-specific themes, AI document extraction, and custom subdomains.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
        demoUrl: `https://${config.testAdmin.subdomain}.${config.platformDomain}`,
        githubUrl: 'https://github.com/francismwangi/portfolio-sys',
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
        featured: true,
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        title: 'Real-Time Financial Dashboard',
        description: 'High-frequency transaction monitoring system with WebSocket updates and custom charting widgets.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        demoUrl: 'https://finance-demo.myportfolio.com',
        githubUrl: 'https://github.com/francismwangi/fin-dashboard',
        technologies: ['React', 'Recharts', 'Node.js', 'Redis', 'WebSockets'],
        featured: true,
        orderIndex: 2,
      },
    ],
  });

  // Certifications
  console.log('📜 Seeding Certifications for Test Admin...');
  await prisma.certification.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'AWS Certified Solutions Architect – Associate',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2022-04',
        credentialId: 'AWS-SA-778942',
        credentialUrl: 'https://aws.amazon.com/verification',
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        name: 'Certified Kubernetes Administrator (CKA)',
        issuingOrganization: 'Linux Foundation',
        issueDate: '2023-01',
        credentialId: 'CKA-8849102',
        orderIndex: 2,
      },
    ],
  });

  // Sample Testimonials / Reviews
  console.log('⭐ Seeding Reviews for Test Admin...');
  await prisma.review.createMany({
    data: [
      {
        profileId: profile.id,
        reviewerName: 'Sarah Jenkins',
        reviewerCompany: 'FinTech Global',
        reviewerJobTitle: 'VP of Engineering',
        reviewerEmail: 'sarah@fintechglobal.com',
        rating: 5,
        reviewText: 'Francis is an exceptional architect! He redesigned our core transaction backend and eliminated performance bottlenecks in record time.',
        isApproved: true,
        isFeatured: true,
        status: 'APPROVED',
      },
      {
        profileId: profile.id,
        reviewerName: 'David Ochieng',
        reviewerCompany: 'Innovate Africa Lab',
        reviewerJobTitle: 'Product Manager',
        reviewerEmail: 'david@innovateafrica.io',
        rating: 5,
        reviewText: 'Outstanding technical leadership and code quality. Francis brings clarity to complex SaaS requirements.',
        isApproved: true,
        isFeatured: true,
        status: 'APPROVED',
      },
    ],
  });

  // Sample Contact Messages
  console.log('✉️ Seeding Messages for Test Admin...');
  await prisma.contactMessage.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'Michael Chang',
        email: 'michael.chang@techcorp.com',
        subject: 'Consulting Opportunity for SaaS Platform',
        message: 'Hi Francis, we saw your multi-tenant platform work and would love to discuss a contract architecture consultation with your team.',
        isRead: false,
      },
    ],
  });

  // Sample Analytics Events
  console.log('📊 Seeding Analytics Events for Test Admin...');
  for (let i = 0; i < 45; i++) {
    await prisma.analyticsEvent.create({
      data: {
        profileId: profile.id,
        eventType: i % 7 === 0 ? 'DOWNLOAD_RESUME' : 'VIEW',
        deviceType: i % 3 === 0 ? 'Mobile' : 'Desktop',
        browser: 'Chrome',
        referrer: 'https://google.com',
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)),
      },
    });
  }

  console.log('✅ Database Seeding Completed Successfully!');
  console.log('================================================');
  console.log(`👑 Super Admin Creds: ${config.superAdmin.email} / ${config.superAdmin.password}`);
  console.log(`👤 Test Admin Creds:  ${config.testAdmin.email} / ${config.testAdmin.password}`);
  console.log(`🌐 Test Portfolio:   http://${config.testAdmin.subdomain}.${config.platformDomain}:5000`);
  console.log('================================================');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
