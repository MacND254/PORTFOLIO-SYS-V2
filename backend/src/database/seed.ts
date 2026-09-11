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
    update: { themeId: 'graphic-designer' },
    create: {
      profileId: superAdminProfile.id,
      themeId: 'graphic-designer',
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
    update: {
      title: 'Senior Software Architect & Full-Stack Engineer',
      headline: 'Architecting High-Performance Multi-Tenant SaaS Platforms & Enterprise Cloud Solutions',
      summary: 'Passionate Senior Software Architect with 7+ years of expertise in TypeScript, React, Node.js, PostgreSQL, Docker, and Cloud Infrastructure. Proven track record of scaling high-throughput applications, leading cross-functional engineering teams, and delivering mission-critical systems.',
      careerObjective: 'To build resilient, user-centric software products that empower businesses and scale effortlessly across global markets.',
      bio: 'Francis Mwangi is an accomplished software architect based in Nairobi, Kenya. He specialises in designing modern cloud-native systems, event-driven microservice architectures, and slick micro-frontend interfaces. He is a strong believer in developer experience, testability, and clean architectural boundaries. Outside of code, he mentors junior engineers and speaks at regional tech conferences.',
      contactEmail: config.testAdmin.email,
      phone: '+254 700 123 456',
      location: 'Nairobi, Kenya',
      address: 'Westlands Business District, Nairobi, Kenya',
      website: 'https://francismwangi.dev',
      github: 'https://github.com/francismwangi',
      linkedin: 'https://linkedin.com/in/francismwangi',
      twitter: 'https://twitter.com/francismwangi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      completenessScore: 100,
      isPublicEmail: true,
      isPublicPhone: true,
      isPublicLocation: true,
      isPublicAddress: false,
      isPublicSocial: true,
      isPublicReferences: true,
    },
    create: {
      userId: testAdmin.id,
      title: 'Senior Software Architect & Full-Stack Engineer',
      headline: 'Architecting High-Performance Multi-Tenant SaaS Platforms & Enterprise Cloud Solutions',
      summary: 'Passionate Senior Software Architect with 7+ years of expertise in TypeScript, React, Node.js, PostgreSQL, Docker, and Cloud Infrastructure. Proven track record of scaling high-throughput applications, leading cross-functional engineering teams, and delivering mission-critical systems.',
      careerObjective: 'To build resilient, user-centric software products that empower businesses and scale effortlessly across global markets.',
      bio: 'Francis Mwangi is an accomplished software architect based in Nairobi, Kenya. He specialises in designing modern cloud-native systems, event-driven microservice architectures, and slick micro-frontend interfaces. He is a strong believer in developer experience, testability, and clean architectural boundaries. Outside of code, he mentors junior engineers and speaks at regional tech conferences.',
      contactEmail: config.testAdmin.email,
      phone: '+254 700 123 456',
      location: 'Nairobi, Kenya',
      address: 'Westlands Business District, Nairobi, Kenya',
      website: 'https://francismwangi.dev',
      github: 'https://github.com/francismwangi',
      linkedin: 'https://linkedin.com/in/francismwangi',
      twitter: 'https://twitter.com/francismwangi',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      completenessScore: 100,
      isPublicEmail: true,
      isPublicPhone: true,
      isPublicLocation: true,
      isPublicAddress: false,
      isPublicSocial: true,
      isPublicReferences: true,
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
    update: { themeId: 'freelancer-consultant' },
    create: {
      profileId: profile.id,
      themeId: 'freelancer-consultant',
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
  await prisma.award.deleteMany({ where: { profileId: profile.id } });
  await prisma.publication.deleteMany({ where: { profileId: profile.id } });
  await prisma.language.deleteMany({ where: { profileId: profile.id } });
  await prisma.service.deleteMany({ where: { profileId: profile.id } });
  await prisma.reference.deleteMany({ where: { profileId: profile.id } });
  await prisma.membership.deleteMany({ where: { profileId: profile.id } });
  await prisma.customSection.deleteMany({ where: { profileId: profile.id } });
  await prisma.review.deleteMany({ where: { profileId: profile.id } });
  await prisma.contactMessage.deleteMany({ where: { profileId: profile.id } });
  await prisma.analyticsEvent.deleteMany({ where: { profileId: profile.id } });

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
        description: 'Directing technical strategy and multi-tenant cloud architecture for fintech and SaaS platforms serving over 200,000 active users.',
        responsibilities: [
          'Architected multi-tenant SaaS platform handling 50,000+ active subscriptions.',
          'Reduced AWS cloud compute costs by 35% through Redis caching and container optimization.',
          'Spearheaded transition to TypeScript, Next.js, and automated CI/CD pipelines.',
          'Mentored a team of 8 mid-level engineers through weekly architecture reviews.',
        ],
        achievements: [
          'Awarded Technical Innovator of the Year 2023',
          'Delivered zero-downtime migration of legacy monolith to microservices',
        ],
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
          'Optimized database queries reducing API latency by 60%.',
        ],
        achievements: ['Delivered 12 client projects on schedule with zero critical post-release bugs'],
        orderIndex: 2,
      },
      {
        profileId: profile.id,
        company: 'AfriTech Innovations',
        position: 'Full-Stack Developer',
        location: 'Nairobi, Kenya',
        startDate: '2017-08',
        endDate: '2019-05',
        isCurrent: false,
        description: 'Built web and mobile apps for local startups, including mobile payment integrations and inventory systems.',
        responsibilities: [
          'Developed RESTful APIs using Node.js, Express, and MongoDB.',
          'Integrated M-Pesa Daraja API for mobile payments processing KES 500,000+ daily.',
        ],
        achievements: ['Recognised by Kenya ICT Authority for digital health solution deployed across 12 clinics'],
        orderIndex: 3,
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
        startDate: '2013-09',
        endDate: '2017-05',
        grade: 'First Class Honors',
        description: 'Focused on algorithms, software engineering principles, databases, and distributed systems.',
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        institution: 'Coursera / University of Michigan',
        qualification: 'Professional Certificate',
        field: 'Cloud Computing & DevOps Engineering',
        startDate: '2020-01',
        endDate: '2020-09',
        grade: 'Distinction',
        description: 'Completed 6-course specialisation covering cloud architecture patterns, Kubernetes, and Terraform.',
        orderIndex: 2,
      },
    ],
  });

  // Skills
  console.log('⚡ Seeding Skills for Test Admin...');
  await prisma.skill.createMany({
    data: [
      { profileId: profile.id, name: 'TypeScript', category: 'Technical', proficiency: 96, level: 'Expert', orderIndex: 1 },
      { profileId: profile.id, name: 'React / Next.js', category: 'Technical', proficiency: 93, level: 'Expert', orderIndex: 2 },
      { profileId: profile.id, name: 'Node.js / Express', category: 'Technical', proficiency: 91, level: 'Expert', orderIndex: 3 },
      { profileId: profile.id, name: 'PostgreSQL / Prisma', category: 'Technical', proficiency: 89, level: 'Expert', orderIndex: 4 },
      { profileId: profile.id, name: 'GraphQL / REST APIs', category: 'Technical', proficiency: 87, level: 'Expert', orderIndex: 5 },
      { profileId: profile.id, name: 'Docker & Kubernetes', category: 'Technical', proficiency: 85, level: 'Intermediate', orderIndex: 6 },
      { profileId: profile.id, name: 'AWS (EC2, S3, RDS)', category: 'Tool', proficiency: 84, level: 'Intermediate', orderIndex: 7 },
      { profileId: profile.id, name: 'GitHub Actions / CI-CD', category: 'Tool', proficiency: 88, level: 'Expert', orderIndex: 8 },
      { profileId: profile.id, name: 'System Architecture', category: 'Soft', proficiency: 93, level: 'Expert', orderIndex: 9 },
      { profileId: profile.id, name: 'Technical Leadership', category: 'Soft', proficiency: 92, level: 'Expert', orderIndex: 10 },
      { profileId: profile.id, name: 'FinTech & Payments', category: 'Industry', proficiency: 88, level: 'Expert', orderIndex: 11 },
      { profileId: profile.id, name: 'SaaS Product Engineering', category: 'Industry', proficiency: 91, level: 'Expert', orderIndex: 12 },
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
        longDescription: 'Full multi-tenant SaaS application where each user gets an isolated subdomain-driven portfolio. Built with React 18, TypeScript, Node.js, PostgreSQL, Prisma ORM, and Docker.',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
        demoUrl: `https://${config.testAdmin.subdomain}.${config.platformDomain}`,
        githubUrl: 'https://github.com/francismwangi/portfolio-sys',
        technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
        role: 'Lead Architect & Developer',
        featured: true,
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        title: 'Real-Time Financial Dashboard',
        description: 'High-frequency transaction monitoring system with WebSocket updates and custom charting widgets.',
        longDescription: 'Built for a fintech client processing 15,000+ transactions/hour. The backend streams aggregated transaction data via Socket.IO while the frontend renders interactive Recharts dashboards.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        demoUrl: 'https://finance-demo.myportfolio.com',
        githubUrl: 'https://github.com/francismwangi/fin-dashboard',
        technologies: ['React', 'Recharts', 'Node.js', 'Redis', 'WebSockets'],
        role: 'Senior Full-Stack Developer',
        featured: true,
        orderIndex: 2,
      },
      {
        profileId: profile.id,
        title: 'AfriPay — M-Pesa Mobile Payment Gateway',
        description: 'Developer-friendly M-Pesa Daraja API wrapper and payment gateway dashboard supporting STK Push, C2B, and B2C.',
        imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80',
        githubUrl: 'https://github.com/francismwangi/afripay',
        technologies: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'React'],
        role: 'Sole Developer',
        featured: true,
        orderIndex: 3,
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
      {
        profileId: profile.id,
        name: 'Professional Scrum Master I (PSM I)',
        issuingOrganization: 'Scrum.org',
        issueDate: '2021-07',
        credentialId: 'PSM-I-442093',
        orderIndex: 3,
      },
    ],
  });

  // Awards
  console.log('🏆 Seeding Awards for Test Admin...');
  await prisma.award.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Technical Innovator of the Year',
        organization: 'CloudScale Technologies',
        date: '2023-12',
        description: 'Awarded for technical innovation and measurable architecture impact.',
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        title: 'Best Final Year Project Award',
        organization: 'University of Nairobi',
        date: '2017-06',
        description: 'Judged best project in the 2017 Computer Science cohort.',
        orderIndex: 2,
      },
    ],
  });

  // Publications
  console.log('📚 Seeding Publications for Test Admin...');
  await prisma.publication.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Multi-Tenant SaaS Architecture Patterns for African Startups',
        publisher: 'Dev.to Tech Journal',
        date: '2023-06',
        url: 'https://dev.to/francismwangi/multitenant-saas-africa',
        description: 'Comprehensive guide covering row-level security and subdomain routing.',
        orderIndex: 1,
      },
    ],
  });

  // Languages
  console.log('🌍 Seeding Languages for Test Admin...');
  await prisma.language.createMany({
    data: [
      { profileId: profile.id, language: 'English', proficiency: 'Fluent', orderIndex: 1 },
      { profileId: profile.id, language: 'Swahili', proficiency: 'Native', orderIndex: 2 },
    ],
  });

  // Services
  console.log('🛠️ Seeding Services for Test Admin...');
  await prisma.service.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Cloud Architecture Consulting',
        description: 'End-to-end cloud architecture design, AWS infrastructure planning, and SaaS multi-tenancy audit.',
        price: 'From $150/hr',
        features: ['Architecture Review', 'Infrastructure Diagrams', 'Cost Estimation', 'POC Build'],
        orderIndex: 1,
      },
      {
        profileId: profile.id,
        title: 'Full-Stack Web App Development',
        description: 'Custom web apps using React, Next.js, Node.js, and PostgreSQL from MVP to production scale.',
        price: 'From $5,000/project',
        features: ['Requirements Analysis', 'Frontend & Backend', 'Database Design', 'CI/CD Deployment'],
        orderIndex: 2,
      },
    ],
  });

  // References
  console.log('👥 Seeding References for Test Admin...');
  await prisma.reference.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'James Kamau',
        position: 'Chief Technology Officer',
        organization: 'CloudScale Technologies',
        email: 'james.kamau@cloudscale.co.ke',
        phone: '+254 722 456 789',
        relationship: 'Direct Manager',
        isPublic: true,
        orderIndex: 1,
      },
    ],
  });

  // Memberships
  console.log('🏛️ Seeding Memberships for Test Admin...');
  await prisma.membership.createMany({
    data: [
      {
        profileId: profile.id,
        organization: 'Kenya ICT Board — Developer Community',
        position: 'Community Mentor',
        startDate: '2020-03',
        isCurrent: true,
        orderIndex: 1,
      },
    ],
  });

  // Custom Section
  console.log('📝 Seeding Custom Sections for Test Admin...');
  await prisma.customSection.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Open Source & Community',
        content: 'Active contributor to Prisma ORM and open-source school management systems in Kenya.',
        isVisible: true,
        orderIndex: 1,
      },
    ],
  });

  // Reviews
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
      {
        profileId: profile.id,
        reviewerName: 'ANTONY NDUTA',
        reviewerCompany: 'Perseus Tritech',
        reviewerJobTitle: 'Project Manager',
        reviewerEmail: 'machariant@gmail.com',
        rating: 5,
        reviewText: 'Amazing and quality work done. Really appreciated his professionalism.',
        isApproved: true,
        isFeatured: false,
        status: 'APPROVED',
      },
    ],
  });

  // Contact Messages
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
      {
        profileId: profile.id,
        name: 'ANTONY NDUTA',
        email: 'archer.tritech@gmail.com',
        subject: '[DOCUMENT_ACCESS_REQUEST] Key Request from ANTONY NDUTA (Archer Solutions)',
        message: 'Background Check for a Senior position',
        type: 'DOCUMENT_ACCESS_REQUEST',
        status: 'ACCEPTED',
        isRead: true,
      },
      {
        profileId: profile.id,
        name: 'Morgan Keen',
        email: 'macharia.t.me@gmail.com',
        subject: 'Job Opportunity',
        message: 'We would like you to visit our offices on monday at 13th Street, 7th floor room 13 to discuss your quality on an available position in our firm.',
        type: 'GENERAL',
        status: 'PENDING',
        isRead: true,
      },
      {
        profileId: profile.id,
        name: 'Macharia Antony',
        email: 'archer.tritech@gmail.com',
        subject: '[DOCUMENT_ACCESS_REQUEST] Key Request from Macharia Antony (ACME TRADERS)',
        message: 'Background check',
        type: 'DOCUMENT_ACCESS_REQUEST',
        status: 'ACCEPTED',
        isRead: true,
      },
    ],
  });

  // Analytics Events
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

  // ── 4. System Settings ─────────────────────────────────────
  console.log('⚙️ Seeding System Settings...');
  const systemSettings = [
    { key: 'PLATFORM_NAME', value: 'Portfolio SaaS Enterprise', description: 'Public platform branding title.' },
    { key: 'ALLOW_REGISTRATION', value: 'false', description: 'Allow new tenant user registrations.' },
    { key: 'MAINTENANCE_MODE', value: 'false', description: 'Enable platform maintenance mode (block non-admin traffic).' },
    { key: 'MAX_CV_UPLOAD_MB', value: '10', description: 'Maximum file size allowed for CV uploads in megabytes.' },
    { key: 'DEFAULT_FAVICON_URL', value: '', description: 'Default global browser favicon URL (.ico, .png, .svg).' },
    { key: 'GA4_MEASUREMENT_ID', value: '', description: 'Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX).' },
    { key: 'PLAUSIBLE_DOMAIN', value: '', description: 'Plausible Analytics Custom Tracking Domain.' },
    { key: 'PWA_APP_NAME', value: 'Portfolio SaaS Enterprise', description: 'PWA Web Manifest Application Name.' },
    { key: 'PWA_SHORT_NAME', value: 'Portfolio', description: 'PWA Web Manifest Short Name.' },
    { key: 'PWA_THEME_COLOR', value: '#4f46e5', description: 'PWA Primary Theme Color Hex.' },
    { key: 'PWA_BACKGROUND_COLOR', value: '#0f172a', description: 'PWA App Background Color Hex.' },
    { key: 'SMTP_HOST', value: 'smtp.gmail.com', description: 'Portfolio Gateway: Host' },
    { key: 'SMTP_PORT', value: '587', description: 'Portfolio Gateway: Port' },
    { key: 'SMTP_SECURE', value: 'false', description: 'Portfolio Gateway: SSL' },
    { key: 'SMTP_USER', value: '', description: 'Portfolio Gateway: Username' },
    { key: 'SMTP_PASS', value: '', description: 'Portfolio Gateway: Password' },
    { key: 'SMTP_FROM_EMAIL', value: '', description: 'Portfolio Gateway: From Email' },
    { key: 'SMTP_FROM_NAME', value: 'Portfolio SaaS Mailer', description: 'Portfolio Gateway: From Name' },
    { key: 'SMTP_RESET_HOST', value: 'smtp.gmail.com', description: 'Password Reset Gateway: Host' },
    { key: 'SMTP_RESET_PORT', value: '587', description: 'Password Reset Gateway: Port' },
    { key: 'SMTP_RESET_SECURE', value: 'false', description: 'Password Reset Gateway: SSL' },
    { key: 'SMTP_RESET_USER', value: '', description: 'Password Reset Gateway: Username' },
    { key: 'SMTP_RESET_PASS', value: '', description: 'Password Reset Gateway: Password' },
    { key: 'SMTP_RESET_FROM_EMAIL', value: '', description: 'Password Reset Gateway: From Email' },
    { key: 'SMTP_RESET_FROM_NAME', value: 'Portfolio Security & Password Reset Gateway', description: 'Password Reset Gateway: From Name' },
    { key: 'OPENAI_API_KEY', value: '', description: 'API Key for AI CV Parsing Service.' },
  ];
  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // ── 5. Platform Testimonials ────────────────────────────────
  console.log('💬 Seeding Platform Testimonials...');
  await prisma.platformTestimonial.upsert({
    where: { id: '1ef6c7a9-4195-4ec6-bb88-6726616a9490' },
    update: {},
    create: {
      id: '1ef6c7a9-4195-4ec6-bb88-6726616a9490',
      submitterName: 'Dr. Gregory House',
      submitterEmail: 'house@ppth.org',
      submitterRole: 'Chief of Diagnostic Medicine',
      submitterCompany: 'Princeton-Plainsboro',
      content: 'Astonishing platform. Highlighted my medical research and clinical case studies flawlessly.',
      rating: 5,
      status: 'APPROVED',
    },
  });

  // ── 6. Seed Additional Admin: Macharia Antony ───────────────
  console.log('👤 Seeding Additional Admin (Macharia Antony)...');
  const machariaPassword = await bcrypt.hash('ChangeMe@12345', 12);

  const machariaAdmin = await prisma.user.upsert({
    where: { email: 'machariant@gmail.com' },
    update: {
      fullName: 'Macharia Antony',
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: 'Macharia Antony',
      email: 'machariant@gmail.com',
      password: machariaPassword,
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
      desiredProfession: 'Software Engineer',
    },
  });

  await prisma.subdomain.upsert({
    where: { slug: 'machariaantony' },
    update: { userId: machariaAdmin.id, isPrimary: true },
    create: {
      userId: machariaAdmin.id,
      slug: 'machariaantony',
      isPrimary: true,
    },
  });

  const machariaProfile = await prisma.profile.upsert({
    where: { userId: machariaAdmin.id },
    update: {
      title: 'Software Engineer',
      headline: 'Software Engineer | Scalable Solutions & Product Delivery',
      phone: '2025071613553',
      location: 'Nairobi, Kenya',
      linkedin: 'linkedin.com/in/antony-nduta-099376199',
      avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJMs6IZR0xu6lX5ShA24CsS5nCDCYFdpJQ-n43MyPjCNwVmHAU=s96-c',
      completenessScore: 95,
      isPublicEmail: true,
      isPublicPhone: false,
      isPublicLocation: true,
      isPublicSocial: true,
    },
    create: {
      userId: machariaAdmin.id,
      title: 'Software Engineer',
      headline: 'Software Engineer | Scalable Solutions & Product Delivery',
      phone: '2025071613553',
      location: 'Nairobi, Kenya',
      linkedin: 'linkedin.com/in/antony-nduta-099376199',
      avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJMs6IZR0xu6lX5ShA24CsS5nCDCYFdpJQ-n43MyPjCNwVmHAU=s96-c',
      completenessScore: 95,
      isPublicEmail: true,
      isPublicPhone: false,
      isPublicLocation: true,
      isPublicSocial: true,
    },
  });

  await prisma.portfolioStatus.upsert({
    where: { profileId: machariaProfile.id },
    update: { isPublished: true, publishStatus: 'PUBLISHED' },
    create: {
      profileId: machariaProfile.id,
      isPublished: true,
      publishStatus: 'PUBLISHED',
      publishedAt: new Date('2026-08-19T15:09:03.580Z'),
    },
  });

  await prisma.portfolioCustomization.upsert({
    where: { profileId: machariaProfile.id },
    update: { themeId: 'software-engineer' },
    create: {
      profileId: machariaProfile.id,
      themeId: 'software-engineer',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      showQrInPdf: true,
      showSocialLinks: true,
    },
  });

  await prisma.experience.deleteMany({ where: { profileId: machariaProfile.id } });
  await prisma.education.deleteMany({ where: { profileId: machariaProfile.id } });
  await prisma.skill.deleteMany({ where: { profileId: machariaProfile.id } });
  await prisma.project.deleteMany({ where: { profileId: machariaProfile.id } });
  await prisma.certification.deleteMany({ where: { profileId: machariaProfile.id } });

  await prisma.experience.createMany({
    data: [
      {
        profileId: machariaProfile.id,
        company: 'Tech Solutions Inc.',
        position: 'Software Engineer',
        location: 'Remote',
        startDate: '2021-01',
        endDate: 'Present',
        isCurrent: true,
        description: 'Led technical initiatives, architected scalable systems, and mentored junior staff.',
        orderIndex: 0,
      },
    ],
  });

  await prisma.education.createMany({
    data: [
      {
        profileId: machariaProfile.id,
        institution: 'University of Engineering & Technology',
        qualification: 'Bachelor of Science',
        field: 'Computer Science & Software Engineering',
        startDate: '2016-09',
        endDate: '2020-05',
        grade: 'First Class Honors',
        orderIndex: 0,
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { profileId: machariaProfile.id, name: 'Node.js', category: 'Technical', proficiency: 90, orderIndex: 0 },
      { profileId: machariaProfile.id, name: 'React', category: 'Technical', proficiency: 90, orderIndex: 1 },
      { profileId: machariaProfile.id, name: 'TypeScript', category: 'Technical', proficiency: 90, orderIndex: 2 },
      { profileId: machariaProfile.id, name: 'PostgreSQL', category: 'Technical', proficiency: 90, orderIndex: 3 },
    ],
  });

  await prisma.project.createMany({
    data: [
      {
        profileId: machariaProfile.id,
        title: 'Multi-Tenant SaaS Platform',
        description: 'Engineered a multi-tenant platform with automated subdomain routing and dynamic resume parsing.',
        demoUrl: 'https://demo.myportfolio.com',
        githubUrl: 'https://github.com/example/portfolio-sys',
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
        featured: false,
        orderIndex: 0,
      },
    ],
  });

  await prisma.certification.createMany({
    data: [
      {
        profileId: machariaProfile.id,
        name: 'AWS Certified Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2022-06',
        credentialId: 'AWS-SA-88942',
        orderIndex: 0,
      },
    ],
  });

  // ── 7. Seed Additional Admin: Kevin Mureithi Mwangi ────────
  console.log('👤 Seeding Additional Admin (Kevin Mureithi Mwangi)...');
  const kevinPassword = await bcrypt.hash('ChangeMe@12345', 12);

  const kevinAdmin = await prisma.user.upsert({
    where: { email: 'romeo.dev369@gmail.com' },
    update: {
      fullName: 'KEVIN MUREITHI MWANGI',
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: 'KEVIN MUREITHI MWANGI',
      email: 'romeo.dev369@gmail.com',
      password: kevinPassword,
      role: Role.ADMIN,
      status: 'ACTIVE',
      emailVerified: true,
      desiredProfession: 'Teacher / Educator',
    },
  });

  await prisma.subdomain.upsert({
    where: { slug: 'alpha' },
    update: { userId: kevinAdmin.id, isPrimary: true },
    create: {
      userId: kevinAdmin.id,
      slug: 'alpha',
      isPrimary: true,
    },
  });

  const kevinProfile = await prisma.profile.upsert({
    where: { userId: kevinAdmin.id },
    update: {
      title: 'ELECTRIC, INSTRUMENTATION AND CONTROL TECHNICIAN',
      headline: 'ELECTRIC, INSTRUMENTATION AND CONTROL TECHNICIAN',
      phone: '0798779200',
      location: '284 - 00900, KIAMBU',
      website: 'https://gmail.com/',
      completenessScore: 75,
      isPublicEmail: true,
      isPublicPhone: false,
      isPublicLocation: true,
      isPublicSocial: true,
    },
    create: {
      userId: kevinAdmin.id,
      title: 'ELECTRIC, INSTRUMENTATION AND CONTROL TECHNICIAN',
      headline: 'ELECTRIC, INSTRUMENTATION AND CONTROL TECHNICIAN',
      phone: '0798779200',
      location: '284 - 00900, KIAMBU',
      website: 'https://gmail.com/',
      completenessScore: 75,
      isPublicEmail: true,
      isPublicPhone: false,
      isPublicLocation: true,
      isPublicSocial: true,
    },
  });

  await prisma.portfolioStatus.upsert({
    where: { profileId: kevinProfile.id },
    update: { isPublished: true, publishStatus: 'PUBLISHED' },
    create: {
      profileId: kevinProfile.id,
      isPublished: true,
      publishStatus: 'PUBLISHED',
      publishedAt: new Date('2026-08-24T10:29:58.551Z'),
    },
  });

  await prisma.portfolioCustomization.upsert({
    where: { profileId: kevinProfile.id },
    update: { themeId: 'mechanical-engineer' },
    create: {
      profileId: kevinProfile.id,
      themeId: 'mechanical-engineer',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      showQrInPdf: true,
      showSocialLinks: true,
    },
  });

  await prisma.experience.deleteMany({ where: { profileId: kevinProfile.id } });
  await prisma.education.deleteMany({ where: { profileId: kevinProfile.id } });
  await prisma.skill.deleteMany({ where: { profileId: kevinProfile.id } });
  await prisma.certification.deleteMany({ where: { profileId: kevinProfile.id } });
  await prisma.reference.deleteMany({ where: { profileId: kevinProfile.id } });
  await prisma.language.deleteMany({ where: { profileId: kevinProfile.id } });

  await prisma.experience.createMany({
    data: [
      {
        profileId: kevinProfile.id,
        company: 'K.T.D.A Nyamachae Tea Factory',
        position: 'Electrician Attache',
        location: 'Kisii, Kenya',
        startDate: '05/2023',
        endDate: '07/2023',
        isCurrent: false,
        description: 'Motor rewinding\nMotor servicing\nGenerator servicing\nDol and star delta starter terminations\nProcess monitoring',
        orderIndex: 0,
      },
      {
        profileId: kevinProfile.id,
        company: 'Schindler Limited',
        position: 'Service Technician Attache',
        location: 'Nairobi, Kenya',
        startDate: '05/2022',
        endDate: '08/2022',
        isCurrent: false,
        description: 'Elevator servicing\nEscalator servicing\nLift breakdown repair\nEscalator troubleshooting\nLift commissioning',
        orderIndex: 1,
      },
      {
        profileId: kevinProfile.id,
        company: 'Sammyster electricals',
        position: 'Electrician',
        location: 'Nairobi, Kenya',
        startDate: '08/2023',
        endDate: '01/2024',
        isCurrent: false,
        description: 'Domestic wiring works\nElectrical wirings troubleshooting\nIndustrial electrical wiring\nDomestic lighting and interior design',
        orderIndex: 2,
      },
      {
        profileId: kevinProfile.id,
        company: 'Rentstate ltd',
        position: 'Technician',
        location: 'Nairobi, Kenya',
        startDate: '02/2024',
        isCurrent: true,
        description: 'Elevator Installations and costing\nElevator troubleshooting\nEscalator service and maintenance\nElevator maintenance and breakdown repair\nLift slow speed and high speed commissioning',
        orderIndex: 3,
      },
    ],
  });

  await prisma.education.createMany({
    data: [
      {
        profileId: kevinProfile.id,
        institution: 'University of Eastern Africa, Baraton',
        qualification: 'Bachelor Of Science',
        field: 'Electronics Technology (Industrial Option)',
        startDate: '09/2019',
        endDate: '04/2023',
        orderIndex: 0,
      },
      {
        profileId: kevinProfile.id,
        institution: 'Kiambu High School',
        qualification: 'Kenya Certificate of Secondary Education',
        startDate: '02/2014',
        endDate: '11/2017',
        orderIndex: 1,
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { profileId: kevinProfile.id, name: 'Access DBMS', category: 'Technical', proficiency: 75, level: 'Intermediate', orderIndex: 0 },
      { profileId: kevinProfile.id, name: 'Excel', category: 'Tool', proficiency: 75, level: 'Intermediate', orderIndex: 1 },
      { profileId: kevinProfile.id, name: 'Word', category: 'Tool', proficiency: 75, level: 'Intermediate', orderIndex: 2 },
      { profileId: kevinProfile.id, name: 'CMD', category: 'Tool', proficiency: 75, level: 'Intermediate', orderIndex: 3 },
      { profileId: kevinProfile.id, name: 'Powerpoint', category: 'Tool', proficiency: 75, level: 'Intermediate', orderIndex: 4 },
      { profileId: kevinProfile.id, name: 'IBM SPSS', category: 'Tool', proficiency: 75, level: 'Intermediate', orderIndex: 5 },
      { profileId: kevinProfile.id, name: 'Excellent Communication Skills', category: 'Soft', proficiency: 50, orderIndex: 6 },
      { profileId: kevinProfile.id, name: 'Motivational And Guidance Speaker', category: 'Soft', proficiency: 50, orderIndex: 7 },
      { profileId: kevinProfile.id, name: 'Time Management', category: 'Soft', proficiency: 50, orderIndex: 8 },
      { profileId: kevinProfile.id, name: 'Persuasive/Convincing', category: 'Soft', proficiency: 50, orderIndex: 9 },
      { profileId: kevinProfile.id, name: 'Organizational Skills', category: 'Soft', proficiency: 50, orderIndex: 10 },
      { profileId: kevinProfile.id, name: 'Team Player', category: 'Soft', proficiency: 50, orderIndex: 11 },
      { profileId: kevinProfile.id, name: 'Research', category: 'Soft', proficiency: 50, orderIndex: 12 },
      { profileId: kevinProfile.id, name: 'Report Writing Skills', category: 'Soft', proficiency: 50, orderIndex: 13 },
      { profileId: kevinProfile.id, name: 'Analytical Skills', category: 'Soft', proficiency: 50, orderIndex: 14 },
      { profileId: kevinProfile.id, name: 'Math And Data Analysis', category: 'Industry', proficiency: 50, orderIndex: 15 },
      { profileId: kevinProfile.id, name: 'Induction Motor Troubleshooting And Servicing', category: 'Industry', proficiency: 50, orderIndex: 16 },
      { profileId: kevinProfile.id, name: 'Elevator Servicing And Maintenance', category: 'Industry', proficiency: 50, orderIndex: 17 },
      { profileId: kevinProfile.id, name: 'Elevator And Escalator Breakdown Repairs', category: 'Industry', proficiency: 50, orderIndex: 18 },
      { profileId: kevinProfile.id, name: 'Generator Servicing', category: 'Industry', proficiency: 50, orderIndex: 19 },
      { profileId: kevinProfile.id, name: 'Control Panel Service And Troubleshooting', category: 'Industry', proficiency: 50, orderIndex: 20 },
      { profileId: kevinProfile.id, name: 'Electrical Diagram Reading And Interpretation', category: 'Industry', proficiency: 50, orderIndex: 21 },
    ],
  });

  await prisma.certification.createMany({
    data: [
      {
        profileId: kevinProfile.id,
        name: 'Computer Packages Level 1',
        issuingOrganization: 'Kiambu High School / Baraton University',
        issueDate: '2022',
        orderIndex: 0,
      },
      {
        profileId: kevinProfile.id,
        name: 'Financial and taxes Training',
        issuingOrganization: 'Kenya Revenue Authority',
        issueDate: '04/2021',
        expiryDate: '05/2021',
        orderIndex: 1,
      },
      {
        profileId: kevinProfile.id,
        name: 'EQUITY LEADERSHIP PROGRAM',
        issuingOrganization: 'EQUITY BANK',
        issueDate: '05/2016',
        expiryDate: '06/2016',
        orderIndex: 2,
      },
    ],
  });

  await prisma.reference.createMany({
    data: [
      {
        profileId: kevinProfile.id,
        name: 'Engineer Conrad Ambani',
        position: 'Electrical Engineer',
        organization: 'Schindler Kenya',
        email: 'conrad.ambani@schindler.com',
        phone: '0110583647',
        isPublic: false,
        orderIndex: 0,
      },
      {
        profileId: kevinProfile.id,
        name: 'Mr. James Ayiemba',
        position: 'Lecturer',
        organization: 'Baraton University',
        email: 'ayiembaj@ueab.ac.ke',
        phone: '0724155587',
        isPublic: false,
        orderIndex: 1,
      },
      {
        profileId: kevinProfile.id,
        name: 'Mr. Benjamin Nyagero',
        position: 'Senior electrician',
        organization: 'K.T.D.A. Nyamache tea factory',
        phone: '0726374490',
        isPublic: false,
        orderIndex: 2,
      },
    ],
  });

  await prisma.language.createMany({
    data: [
      { profileId: kevinProfile.id, language: 'English', proficiency: 'Professional', orderIndex: 0 },
      { profileId: kevinProfile.id, language: 'Kiswahili', proficiency: 'Professional', orderIndex: 1 },
    ],
  });

  // ── 8. Seed Company Users (COMPANY role) ─────────────────────
  console.log('🏢 Seeding Company Users and Companies...');
  const companyUserPassword = await bcrypt.hash('ChangeMe@12345', 12);

  // Company Invite (needed before company users)
  const superAdminUser = await prisma.user.findUnique({ where: { email: config.superAdmin.email } });

  const companyInvite = await prisma.companyInvite.upsert({
    where: { token: '224af4e52406478dab3b3439530b6a43cc3d18bc5a3844957ebd49939f5133ac' },
    update: { status: 'ACCEPTED', usageCount: 2 },
    create: {
      token: '224af4e52406478dab3b3439530b6a43cc3d18bc5a3844957ebd49939f5133ac',
      companyName: 'Tri Tech Partners',
      email: 'perseus.tritech@gmail.com, acco.vision.me@gmail.com',
      status: 'ACCEPTED',
      invitedById: superAdminUser!.id,
      expiresAt: new Date('2026-09-16T12:49:19.374Z'),
      usageCount: 2,
      acceptedAt: new Date('2026-09-16T12:49:19.374Z'),
    },
  });

  // Company User 1: Antony Macharia (Tri Tech Partners)
  const companyUser1 = await prisma.user.upsert({
    where: { email: 'perseus.tritech@gmail.com' },
    update: {
      fullName: 'Antony Macharia',
      role: Role.COMPANY,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: 'Antony Macharia',
      email: 'perseus.tritech@gmail.com',
      password: companyUserPassword,
      role: Role.COMPANY,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.company.upsert({
    where: { userId: companyUser1.id },
    update: {
      name: 'Tri Tech Partners',
      industry: 'Technology',
      companySize: '11-50',
      location: 'Nairobi, Kenya',
      contactPerson: 'Antony Macharia',
      contactEmail: 'perseus.tritech@gmail.com',
    },
    create: {
      userId: companyUser1.id,
      inviteId: companyInvite.id,
      name: 'Tri Tech Partners',
      industry: 'Technology',
      companySize: '11-50',
      location: 'Nairobi, Kenya',
      contactPerson: 'Antony Macharia',
      contactEmail: 'perseus.tritech@gmail.com',
    },
  });

  // Company User 2: Acco Vision
  const companyUser2 = await prisma.user.upsert({
    where: { email: 'acco.vision.me@gmail.com' },
    update: {
      fullName: 'Acco Vision',
      role: Role.COMPANY,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      fullName: 'Acco Vision',
      email: 'acco.vision.me@gmail.com',
      password: companyUserPassword,
      role: Role.COMPANY,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  await prisma.company.upsert({
    where: { userId: companyUser2.id },
    update: {
      name: 'Acco Vision',
      industry: 'Energy',
      companySize: '51-200',
      location: 'Nairobi, Kenya',
      contactPerson: 'Acco Hiring Team',
      contactEmail: 'acco.vision.me@gmail.com',
    },
    create: {
      userId: companyUser2.id,
      inviteId: companyInvite.id,
      name: 'Acco Vision',
      industry: 'Energy',
      companySize: '51-200',
      location: 'Nairobi, Kenya',
      contactPerson: 'Acco Hiring Team',
      contactEmail: 'acco.vision.me@gmail.com',
    },
  });

  console.log('✅ Database Seeding Completed Successfully!');
  console.log('================================================');
  console.log(`👑 Super Admin Creds: ${config.superAdmin.email} / ${config.superAdmin.password}`);
  console.log(`👤 Test Admin Creds:  ${config.testAdmin.email} / ${config.testAdmin.password}`);
  console.log(`👤 Macharia Admin:    machariant@gmail.com / ChangeMe@12345`);
  console.log(`👤 Kevin Admin:       romeo.dev369@gmail.com / ChangeMe@12345`);
  console.log(`🏢 Company (Tri Tech): perseus.tritech@gmail.com / ChangeMe@12345`);
  console.log(`🏢 Company (Acco):    acco.vision.me@gmail.com / ChangeMe@12345`);
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
