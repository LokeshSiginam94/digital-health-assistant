import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import Admin from '../models/Admin.js'

dotenv.config()

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL,
    })

    if (existingAdmin) {
      console.log('Admin already exists')
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)

    const admin = new Admin({
      name: 'Main Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
    })

    await admin.save()

    console.log('Default admin created successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin:', error.message)
    process.exit(1)
  }
}

seedAdmin()