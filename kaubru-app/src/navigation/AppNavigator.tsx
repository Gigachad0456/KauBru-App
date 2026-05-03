import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

import HomeScreen from '../screens/HomeScreen';
import DictionaryScreen from '../screens/DictionaryScreen';
import LearnScreen from '../screens/LearnScreen';
import ContributeScreen from '../screens/ContributeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PremiumScreen from '../screens/PremiumScreen';
import PronunciationScreen from '../screens/PronunciationScreen';
import SavedWordsScreen from '../screens/SavedWordsScreen';
import MyContributionsScreen from '../screens/MyContributionsScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import QuizScreen from '../screens/QuizScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import StoriesScreen from '../screens/StoriesScreen';
import StoryDetailScreen from '../screens/StoryDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import { COLORS, RADIUS, SPACING, SHADOW } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonWord {
  id: number;
  english: string;
  kaubru: string;
  audio_url?: string;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  category: string;
  progress: number;
  is_premium: boolean;
  words?: LessonWord[];
  created_at: string;
}

export type AppStackParamList = {
  MainTabs: undefined;
  Premium: undefined;
  Pronunciation: undefined;
  SavedWords: undefined;
  MyContributions: undefined;
  LessonDetail: { lesson: Lesson };
  Quiz: { lesson: Lesson };
  EditProfile: undefined;
  Stories: undefined;
  StoryDetail: { story: any };
  Notifications: undefined;
};

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

type TabIconProps = { focused: boolean; size: number };

function TabIcon({ name, focused, size }: TabIconProps & { name: string }) {
  const color = focused ? COLORS.primary : COLORS.textMuted;
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Ionicons name={name as any} size={size} color={color} />
    </View>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused, size }) => {
          const icons: Record<string, { name: string; lib?: string }> = {
            Translate:   { name: 'swap-horizontal' },
            Dictionary:  { name: 'book-outline' },
            Learn:       { name: 'school-outline' },
            Contribute:  { name: 'pencil-outline' },
            Profile:     { name: 'person-outline' },
          };
          const cfg = icons[route.name] || { name: 'ellipse-outline' };
          return <TabIcon name={cfg.name} focused={focused} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Translate"  component={HomeScreen} />
      <Tab.Screen name="Dictionary" component={DictionaryScreen} />
      <Tab.Screen name="Learn"      component={LearnScreen} />
      <Tab.Screen name="Contribute" component={ContributeScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login"      component={LoginScreen} />
      <Stack.Screen name="Signup"     component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ─── App Stack ────────────────────────────────────────────────────────────────

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"       component={MainTabs} />
      <Stack.Screen name="Premium"        component={PremiumScreen} />
      <Stack.Screen name="Pronunciation"  component={PronunciationScreen} />
      <Stack.Screen name="SavedWords"     component={SavedWordsScreen} />
      <Stack.Screen name="MyContributions" component={MyContributionsScreen} />
      <Stack.Screen name="LessonDetail"   component={LessonDetailScreen} />
      <Stack.Screen name="Quiz"           component={QuizScreen} />
      <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
      <Stack.Screen name="Stories"        component={StoriesScreen} />
      <Stack.Screen name="StoryDetail"    component={StoryDetailScreen} />
      <Stack.Screen name="Notifications"  component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingOverlay />;
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    ...SHADOW.md,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tabIconWrap: {
    width: 36, height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.bgGreenLight,
  },
});
