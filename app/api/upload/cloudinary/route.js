import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { file } = body;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: 'blog-images',
      resource_type: 'auto'
    });

    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id 
    });
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: 'Image upload failed' },
      { status: 500 }
    );
  }
}