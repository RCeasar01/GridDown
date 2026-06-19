import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { GuideScreen } from '../screens/GuideScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AdvisorScreen } from '../screens/AdvisorScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { MapScreen } from '../screens/MapScreen';
import { ContentPacksScreen } from '../screens/ContentPacksScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FounderScreen } from '../screens/FounderScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { TranslatorScreen } from '../screens/TranslatorScreen';
import { HamRadioScreen } from '../screens/HamRadioScreen';
import { MorseCodeScreen } from '../screens/MorseCodeScreen';

// ─── Stack navigators ─────────────────────────────────────────────────────────

export type HomeStackParamList = {
  HomeMain: undefined;
  Category: { categoryId: string };
  Guide: { guideId: string };
  Paywall: { featureName?: string };
  Founder: undefined;
};

export type MoreStackParamList = {
  MoreMain: undefined;
  Checklists: undefined;
  Map: undefined;
  ContentPacks: undefined;
  Referral: undefined;
  Settings: undefined;
  Founder: undefined;
  Translator: undefined;
  HamRadio: undefined;
  MorseCode: undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const, color: Colors.textPrimary },
  contentStyle: { backgroundColor: Colors.background },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'GridDown', headerShown: false }} />
      <HomeStack.Screen name="Category" component={CategoryScreen} options={{ title: '' }} />
      <HomeStack.Screen name="Guide" component={GuideScreen} options={{ title: '' }} />
      <HomeStack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Upgrade', presentation: 'modal' }} />
      <HomeStack.Screen name="Founder" component={FounderScreen} options={{ title: 'About the Founder' }} />
    </HomeStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Checklists" component={ChecklistScreen} options={{ title: 'Checklists' }} />
      <MoreStack.Screen name="Map" component={MapScreen} options={{ title: 'Offline Map' }} />
      <MoreStack.Screen name="ContentPacks" component={ContentPacksScreen} options={{ title: 'Content Packs' }} />
      <MoreStack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Referral Program' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <MoreStack.Screen name="Founder" component={FounderScreen} options={{ title: 'About the Founder' }} />
      <MoreStack.Screen name="Translator" component={TranslatorScreen} options={{ title: 'Offline Translator' }} />
      <MoreStack.Screen name="HamRadio" component={HamRadioScreen} options={{ title: 'HAM Radio Repeaters' }} />
      <MoreStack.Screen name="MorseCode" component={MorseCodeScreen} options={{ title: 'Morse Code' }} />
    </MoreStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.tabBar,
            borderTopColor: Colors.tabBarBorder,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const iconMap: Record<string, { focused: string; outline: string }> = {
              Home: { focused: 'home', outline: 'home-outline' },
              Search: { focused: 'search', outline: 'search-outline' },
              Advisor: { focused: 'radio', outline: 'radio-outline' },
              Community: { focused: 'people', outline: 'people-outline' },
              More: { focused: 'grid', outline: 'grid-outline' },
            };
            const icons = iconMap[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };
            const iconName = focused ? icons.focused : icons.outline;
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Advisor" component={AdvisorScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="More" component={MoreStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
