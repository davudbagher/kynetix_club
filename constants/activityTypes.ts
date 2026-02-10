// constants/activityTypes.ts

export type ActivityType =
    | 'workout'
    | 'run'
    | 'walk'
    | 'gym_checkin'
    | 'streak_milestone'
    | 'challenge_joined'
    | 'challenge_completed'
    | 'goal_reached';

export interface ActivityTypeConfig {
    icon: string;
    color: string;
    points: number;
    bgColor: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
    workout: {
        icon: '💪',
        color: '#FF6B6B',
        bgColor: 'rgba(255, 107, 107, 0.15)',
        points: 30,
    },
    run: {
        icon: '🏃',
        color: '#4ECDC4',
        bgColor: 'rgba(78, 205, 196, 0.15)',
        points: 50,
    },
    walk: {
        icon: '🚶',
        color: '#95E1D3',
        bgColor: 'rgba(149, 225, 211, 0.15)',
        points: 20,
    },
    gym_checkin: {
        icon: '🏋️',
        color: '#FFE66D',
        bgColor: 'rgba(255, 230, 109, 0.15)',
        points: 20,
    },
    streak_milestone: {
        icon: '🔥',
        color: '#FF9F1C',
        bgColor: 'rgba(255, 159, 28, 0.15)',
        points: 100,
    },
    challenge_joined: {
        icon: '🎯',
        color: '#C6FF00',
        bgColor: 'rgba(198, 255, 0, 0.15)',
        points: 10,
    },
    challenge_completed: {
        icon: '🏆',
        color: '#FFD700',
        bgColor: 'rgba(255, 215, 0, 0.15)',
        points: 200,
    },
    goal_reached: {
        icon: '✨',
        color: '#C6FF00',
        bgColor: 'rgba(198, 255, 0, 0.15)',
        points: 50,
    },
};

// Generate activity title based on type and data
export const generateActivityTitle = (
    userName: string,
    type: ActivityType,
    data?: {
        steps?: number;
        distance?: number;
        streak?: number;
        challengeName?: string;
        location?: string;
    }
): string => {
    const firstName = userName.split(' ')[0];

    switch (type) {
        case 'workout':
            return `${firstName} completed a workout ${ACTIVITY_TYPE_CONFIG.workout.icon}`;
        case 'run':
            if (data?.distance) {
                return `${firstName} ran ${data.distance.toFixed(1)} km ${ACTIVITY_TYPE_CONFIG.run.icon}`;
            }
            return `${firstName} went for a run ${ACTIVITY_TYPE_CONFIG.run.icon}`;
        case 'walk':
            if (data?.steps) {
                return `${firstName} walked ${(data.steps / 1000).toFixed(1)}k steps ${ACTIVITY_TYPE_CONFIG.walk.icon}`;
            }
            return `${firstName} went for a walk ${ACTIVITY_TYPE_CONFIG.walk.icon}`;
        case 'gym_checkin':
            if (data?.location) {
                return `${firstName} checked in at ${data.location}`;
            }
            return `${firstName} checked in at the gym ${ACTIVITY_TYPE_CONFIG.gym_checkin.icon}`;
        case 'streak_milestone':
            return `${firstName} is on a ${data?.streak || 7}-day streak! ${ACTIVITY_TYPE_CONFIG.streak_milestone.icon}`;
        case 'challenge_joined':
            return `${firstName} joined "${data?.challengeName}" ${ACTIVITY_TYPE_CONFIG.challenge_joined.icon}`;
        case 'challenge_completed':
            return `${firstName} completed "${data?.challengeName}" ${ACTIVITY_TYPE_CONFIG.challenge_completed.icon}`;
        case 'goal_reached':
            return `${firstName} reached their daily goal! ${ACTIVITY_TYPE_CONFIG.goal_reached.icon}`;
        default:
            return `${firstName} was active`;
    }
};
