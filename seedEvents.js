import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

const credentials = {
  email: 'mrakmondal6612@gmail.com',
  password: 'Ajay@000'
};

const demoEvents = [
  {
    title: 'Campus Music Festival 2024',
    description: 'Join us for an amazing evening of live music performances from talented student bands and artists. Food stalls, fun activities, and great vibes await! Open to all students and faculty.',
    thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '18:00',
    location: 'Main Campus Ground'
  },
  {
    title: 'Tech Hackathon 2024',
    description: '48-hour coding competition bringing together the brightest minds. Build innovative projects, win amazing prizes worth $5000, and network with industry professionals. Teams of 2-4 members.',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    location: 'Computer Science Building, Lab 301'
  },
  {
    title: 'Spring Career Fair 2024',
    description: 'Connect with top employers from Google, Microsoft, Amazon, and 50+ companies. Bring your resume for on-spot interviews. Dress code: Business Professional.',
    thumbnail: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '10:00',
    location: 'Student Center Hall A'
  },
  {
    title: 'Art & Photography Exhibition',
    description: 'Annual showcase of stunning artworks and photographs created by our talented students. Opening night reception with refreshments. Awards ceremony at 7 PM.',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '16:00',
    location: 'University Arts Gallery'
  },
  {
    title: 'Sports Tournament Championship Finals',
    description: 'Cheer for your favorite teams in the championship finals! Basketball, volleyball, and soccer tournaments concluding matches. Free entry for students with ID.',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934- voices-3e26c8e5c2d1?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    location: 'Sports Complex Main Arena'
  },
  {
    title: 'International Food Festival',
    description: 'Experience cuisines from 15+ countries prepared by student cultural clubs. Free tastings, live cooking demos, cultural performances, and dance shows!',
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '12:00',
    location: 'Central Plaza'
  },
  {
    title: 'AI & Machine Learning Workshop',
    description: 'Hands-on workshop covering Python, TensorFlow, and real-world AI applications. Certificate of participation provided. Limited seats - register early!',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '13:00',
    location: 'Engineering Block, Room 204'
  },
  {
    title: 'Entrepreneurship Summit',
    description: 'Learn from successful startup founders and investors. Pitch your ideas, get feedback, and network with potential investors. Prizes for best pitches!',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:30',
    location: 'Business School Auditorium'
  }
];

async function loginAndSeedEvents() {
  try {
    // Check if server is running
    console.log('Checking server connection...');
    try {
      await axios.get(`${API_BASE_URL}/api/event/getevent`);
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error('❌ Cannot connect to server at', API_BASE_URL);
        console.error('Please make sure:');
        console.error('  1. MongoDB is running');
        console.error('  2. Backend server is running (npm run dev)');
        process.exit(1);
      }
    }
    
    console.log('Logging in with:', credentials.email);
    const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    const { token, user } = loginRes.data;
    
    console.log(`Logged in as: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log('User Type:', user.type);
    console.log('User ID:', user._id);
    
    if (user.type !== 'organizer') {
      console.log('Warning: User is not an organizer. Events may not be created properly.');
    }
    
    console.log(`\nCreating ${demoEvents.length} demo events...\n`);
    
    const createdEvents = [];
    
    for (let i = 0; i < demoEvents.length; i++) {
      const event = demoEvents[i];
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/event/create`,
          event,
          { headers: { 'x-auth-token': token } }
        );
        createdEvents.push(res.data);
        console.log(`✓ Created event ${i + 1}/${demoEvents.length}: ${event.title}`);
      } catch (err) {
        console.error(`✗ Failed to create event ${i + 1}: ${event.title}`);
        console.error('  Error:', err.response?.data?.message || err.message);
      }
    }
    
    console.log(`\n✅ Successfully created ${createdEvents.length} events!`);
    console.log('\nEvent Summary:');
    createdEvents.forEach((event, idx) => {
      console.log(`${idx + 1}. ${event.title} - ${event.date}`);
    });
    
  } catch (error) {
    console.error('❌ Error during login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running on port 8000?');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

loginAndSeedEvents();
