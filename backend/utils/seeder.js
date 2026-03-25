const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Contact = require('../models/Contact');
const Template = require('../models/Template');
const Campaign = require('../models/Campaign');
const Message = require('../models/Message');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env');
  process.exit(1);
}

const main = async () => {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  console.log('✅ Connected to MongoDB for seeding');

  // Clean existing data
  await Message.deleteMany({});
  await Campaign.deleteMany({});
  await Template.deleteMany({});
  await Contact.deleteMany({});
  await User.deleteMany({});

  // Create a default user
  const password = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password,
    role: 'admin',
    isActive: true,
    isVerified: true,
    preferences: { timezone: 'UTC', emailNotifications: true, smsNotifications: true },
  });

  // Create contacts
  const contacts = await Contact.create([
    {
      owner: user._id,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      phone: '+15555550101',
      company: 'Acme Corp',
      jobTitle: 'Marketing',
      tags: ['vip', 'email'],
      lists: ['customers'],
      emailSubscribed: true,
      smsSubscribed: true,
    },
    {
      owner: user._id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+15555550102',
      company: 'Example Inc',
      jobTitle: 'Sales',
      tags: ['newsletter'],
      lists: ['prospects'],
      emailSubscribed: true,
      smsSubscribed: false,
    },
  ]);

  // Create templates
  const templates = await Template.create([
    {
      owner: user._id,
      name: 'Welcome Email',
      subject: 'Welcome to MessageHub!',
      body: 'Hi {{firstName}},\n\nThank you for joining MessageHub. We are excited to support your campaigns!',
      htmlBody: '<p>Hi {{firstName}},</p><p>Thank you for joining MessageHub.</p>',
      type: 'email',
      isActive: true,
      tags: ['welcome'],
    },
    {
      owner: user._id,
      name: 'SMS Alert',
      body: 'Hello {{firstName}}, your MessageHub account is active!',
      type: 'sms',
      isActive: true,
      tags: ['sms'],
    },
  ]);

  // Create a campaign
  const campaign = await Campaign.create({
    owner: user._id,
    name: 'Starter Campaign',
    description: 'Seeded campaign for demo',
    type: 'mixed',
    targetLists: ['customers'],
    targetTags: ['vip'],
    contactCount: contacts.length,
    template: templates[0]._id,
    subject: 'Hello from MessageHub',
    body: 'This is a demo campaign body',
    htmlBody: '<p>This is a demo campaign body</p>',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 5), // 5 min from now
    status: 'scheduled',
    stats: { total: contacts.length },
    messages: [],
    tags: ['demo'],
  });

  // Create a message record for campaign
  const message = await Message.create({
    owner: user._id,
    campaign: campaign._id,
    type: 'email',
    subject: 'Hello from MessageHub',
    body: 'Welcome to the seeded campaign!',
    htmlBody: '<p>Welcome to the seeded campaign!</p>',
    recipients: contacts.map((c) => ({
      contact: c._id,
      email: c.email,
      phone: c.phone,
      name: `${c.firstName} ${c.lastName}`,
      status: 'pending',
    })),
    scheduledAt: new Date(Date.now() + 1000 * 60 * 5),
    status: 'scheduled',
    stats: { total: contacts.length },
    isBulk: true,
    tags: ['demo', 'seeded'],
  });

  campaign.messages = [message._id];
  await campaign.save();

  console.log('✅ Seeding complete');
  console.log(`   - User: ${user.email} / Password: Password123!`);
  console.log(`   - Contacts: ${contacts.length}`);
  console.log(`   - Templates: ${templates.length}`);
  console.log(`   - Campaign: ${campaign.name}`);
  console.log(`   - Message: ${message._id}`);

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Seeder error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});