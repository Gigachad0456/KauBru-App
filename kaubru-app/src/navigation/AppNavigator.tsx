import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/LoadingOverlay';

import OTPVerificationScreen from '../screens/OTPVerificationScreen';
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
import ChatScreen from '../screens/ChatScreen';
import WordRushScreen from '../screens/WordRushScreen';
import CultureBrowseScreen from '../screens/CultureBrowseScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';

import { COLORS, SPACING } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonWord { id: number; english: string; kaubru: string; audio_url?: string; }
interface Lesson {
  id: number; title: string; description?: string;
  category: string; progress: number; is_premium: boolean;
  words?: LessonWord[]; created_at: string;
}

export interface CultureArticlePreview {
  id: number;
  title: string;
  category: string;
  summary?: string;
  cover_image_url?: string;
  tags?: string;
  read_time_minutes: number;
  is_published: boolean;
  created_at: string;
}

export type AppStackParamList = {
  MainTabs: undefined; Premium: undefined; Pronunciation: undefined;
  SavedWords: undefined; MyContributions: undefined;
  LessonDetail: { lesson: Lesson }; Quiz: { lesson: Lesson };
  EditProfile: undefined; Stories: undefined; StoryDetail: { story: any };
  OTPVerification: undefined; WordRush: undefined;
  CultureBrowse: undefined;
  ArticleDetail: { article: CultureArticlePreview };
};

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { name: 'Translate',  icon: 'swap-horizontal',  label: 'Translate'  },
  { name: 'Dictionary', icon: 'book-outline',      label: 'Dictionary' },
  { name: 'Learn',      icon: 'school-outline',    label: 'Learn'      },
  { name: 'Contribute', icon: 'pencil-outline',    label: 'Contribute' },
  { name: 'Profile',    icon: 'person-outline',    label: 'Profile'    },
] as const;

// ─── Custom Tab Bar Icon ──────────────────────────────────────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Ionicons
        name={name as any}
        size={20}
        color={focused ? COLORS.white : 'rgba(255,255,255,0.5)'}
      />
    </View>
  );
}

// ─── Main Tabs ────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={tab?.icon || 'ellipse-outline'}
              focused={focused}
            />
          ),
        };
      }}
    >
      {TABS.map(tab => {
        const components: Record<string, React.ComponentType<any>> = {
          Translate: HomeScreen, Dictionary: DictionaryScreen,
          Learn: LearnScreen, Contribute: ContributeScreen, Profile: ProfileScreen,
        };
        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={components[tab.name]}
          />
        );
      })}
    </Tab.Navigator>
  );
}

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// ─── App Stack ────────────────────────────────────────────────────────────────

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="Premium"         component={PremiumScreen} />
      <Stack.Screen name="Pronunciation"   component={PronunciationScreen} />
      <Stack.Screen name="SavedWords"      component={SavedWordsScreen} />
      <Stack.Screen name="MyContributions" component={MyContributionsScreen} />
      <Stack.Screen name="LessonDetail"    component={LessonDetailScreen} />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
      <Stack.Screen name="Stories"         component={StoriesScreen} />
      <Stack.Screen
        name="StoryDetail"
        component={StoryDetailScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen
        name="WordRush"
        component={WordRushScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
      <Stack.Screen
        name="CultureBrowse"
        component={CultureBrowseScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
      />
    </Stack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { user, loading, pendingVerification } = useAuth();
  if (loading) return <LoadingOverlay />;
  if (pendingVerification) return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Floating pill tab bar
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 24,
    right: 24,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    borderTopWidth: 0,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    paddingBottom: 0,
    paddingTop: 0,
  },

  // Icon container
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
