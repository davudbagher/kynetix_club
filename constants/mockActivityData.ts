// constants/mockActivityData.ts
import { ActivityType, generateActivityTitle } from './activityTypes';

export interface MockActivity {
    id: string;
    userName: string;
    activityType: ActivityType;
    title: string;
    points: number;
    celebrationCount: number;
    locationName?: string;
    createdAt: string;
}

// Generate mock activities for feed
export const MOCK_ACTIVITIES: MockActivity[] = [
    {
        id: '1',
        userName: 'Davud Baghir',
        activityType: 'goal_reached',
        title: generateActivityTitle('Davud Baghir', 'goal_reached'),
        points: 50,
        celebrationCount: 12,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
    {
        id: '2',
        userName: 'Sara Aliyeva',
        activityType: 'gym_checkin',
        title: generateActivityTitle('Sara Aliyeva', 'gym_checkin', { location: 'CrossFit Baku' }),
        points: 20,
        celebrationCount: 8,
        locationName: 'CrossFit Baku',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
    },
    {
        id: '3',
        userName: 'Ali Mammadov',
        activityType: 'streak_milestone',
        title: generateActivityTitle('Ali Mammadov', 'streak_milestone', { streak: 7 }),
        points: 100,
        celebrationCount: 24,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    },
    {
        id: '4',
        userName: 'Nihad Hasanov',
        activityType: 'run',
        title: generateActivityTitle('Nihad Hasanov', 'run', { distance: 5.2 }),
        points: 50,
        celebrationCount: 15,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    },
    {
        id: '5',
        userName: 'Leyla Karimova',
        activityType: 'challenge_joined',
        title: generateActivityTitle('Leyla Karimova', 'challenge_joined', { challengeName: 'February 100km Challenge' }),
        points: 10,
        celebrationCount: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
        id: '6',
        userName: 'Rauf Ibrahimov',
        activityType: 'workout',
        title: generateActivityTitle('Rauf Ibrahimov', 'workout'),
        points: 30,
        celebrationCount: 7,
        locationName: 'Fit Zone Gym',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    },
    {
        id: '7',
        userName: 'Aysel Gasimova',
        activityType: 'walk',
        title: generateActivityTitle('Aysel Gasimova', 'walk', { steps: 8500 }),
        points: 20,
        celebrationCount: 11,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    },
    {
        id: '8',
        userName: 'Elvin Rzayev',
        activityType: 'challenge_completed',
        title: generateActivityTitle('Elvin Rzayev', 'challenge_completed', { challengeName: '7-Day Active Streak' }),
        points: 200,
        celebrationCount: 32,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    },
    {
        id: '9',
        userName: 'Gunay Mammadova',
        activityType: 'gym_checkin',
        title: generateActivityTitle('Gunay Mammadova', 'gym_checkin', { location: 'Planet Fitness' }),
        points: 20,
        celebrationCount: 6,
        locationName: 'Planet Fitness',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    },
    {
        id: '10',
        userName: 'Tural Huseynov',
        activityType: 'run',
        title: generateActivityTitle('Tural Huseynov', 'run', { distance: 3.8 }),
        points: 50,
        celebrationCount: 9,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    },
];

// Get activities with optional filtering
export const getActivities = (limit?: number): MockActivity[] => {
    return limit ? MOCK_ACTIVITIES.slice(0, limit) : MOCK_ACTIVITIES;
};

// Add a new activity (for testing)
export const addMockActivity = (activity: MockActivity): void => {
    MOCK_ACTIVITIES.unshift(activity);
};
