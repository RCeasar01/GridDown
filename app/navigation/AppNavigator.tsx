import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Screens — Home
import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { GuideScreen } from '../screens/GuideScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { FounderScreen } from '../screens/FounderScreen';
import { EmergencyModeScreen } from '../screens/EmergencyModeScreen';
import { MyKitScreen } from '../screens/MyKitScreen';
import { FlowsScreen } from '../screens/FlowsScreen';

// Screens — Learn
import { LearnScreen } from '../screens/LearnScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ContentPacksScreen } from '../screens/ContentPacksScreen';

// Screens — Tools
import { ToolsScreen } from '../screens/ToolsScreen';
import { TranslatorScreen } from '../screens/TranslatorScreen';
import { HamRadioScreen } from '../screens/HamRadioScreen';
import { MorseCodeScreen } from '../screens/MorseCodeScreen';
import { MapScreen } from '../screens/MapScreen';
import { AdvisorScreen } from '../screens/AdvisorScreen';
import { SurvivalCalculatorScreen } from '../screens/SurvivalCalculatorScreen';
import { StarMapScreen } from '../screens/StarMapScreen';
import { ReadinessScanScreen } from '../screens/ReadinessScanScreen';
import { GearInventoryScreen } from '../screens/GearInventoryScreen';
import { FamilyPlannerScreen } from '../screens/FamilyPlannerScreen';
import { CoordinateConverterScreen } from '../screens/CoordinateConverterScreen';
import { KnotGuideScreen } from '../screens/KnotGuideScreen';

// Screens — Drill
import { DrillScreen } from '../screens/DrillScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResultScreen from '../screens/QuizResultScreen';

// Screens — More
import { MoreScreen } from '../screens/MoreScreen';
import { ChecklistScreen } from '../screens/ChecklistScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CommunityScreen } from '../screens/CommunityScreen';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type HomeStackParamList = {
  HomeMain: undefined;
  Category: { categoryId: string };
  Guide: { guideId: string };
  Paywall: { featureName?: string };
  Founder: undefined;
  EmergencyMode: undefined;
  MyKit: undefined;
  Flows: undefined;
};

export type LearnStackParamList = {
  LearnMain: undefined;
  Category: { categoryId: string };
  Guide: { guideId: string };
  ContentPacks: undefined;
  Search: undefined;
};

export type ToolsStackParamList = {
  ToolsMain: undefined;
  Translator: undefined;
  HamRadio: undefined;
  MorseCode: undefined;
  Map: undefined;
  Guide: { guideId: string };
  MyKit: undefined;
  Flows: undefined;
  Advisor: undefined;
  SurvivalCalculator: undefined;
  StarMap: undefined;
  ReadinessScan: undefined;
  GearInventory: undefined;
  FamilyPlanner: undefined;
  CoordinateConverter: undefined;
  KnotGuide: undefined;
};

export type DrillStackParamList = {
  DrillMain: undefined;
  QuizPlay: { category?: string; quizId?: string; isDailyDrill?: boolean };
  QuizResult: {
    category: string;
    total: number;
    correct: number;
    timeTaken: number;
    missedQuizIds: string[];
  };
};

export type MoreStackParamList = {
  MoreMain: undefined;
  Settings: undefined;
  Community: undefined;
  Founder: undefined;
  Referral: undefined;
  Paywall: { featureName?: string };
  Checklists: undefined;
};

// ─── Stack Navigators ─────────────────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LearnStack = createNativeStackNavigator<LearnStackParamList>();
const ToolsStack = createNativeStackNavigator<ToolsStackParamList>();
const DrillStack = createNativeStackNavigator<DrillStackParamList>();
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
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'GridDown', headerShown: false }}
      />
      <HomeStack.Screen name="Category" component={CategoryScreen} options={{ title: '' }} />
      <HomeStack.Screen name="Guide" component={GuideScreen} options={{ title: '' }} />
      <HomeStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: 'Upgrade', presentation: 'modal' }}
      />
      <HomeStack.Screen name="Founder" component={FounderScreen} options={{ title: 'About the Founder' }} />
      <HomeStack.Screen
        name="EmergencyMode"
        component={EmergencyModeScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <HomeStack.Screen name="MyKit" component={MyKitScreen} options={{ title: 'My Kit' }} />
      <HomeStack.Screen name="Flows" component={FlowsScreen} options={{ title: 'Real-World Flows' }} />
    </HomeStack.Navigator>
  );
}

function LearnStackNavigator() {
  return (
    <LearnStack.Navigator screenOptions={stackScreenOptions}>
      <LearnStack.Screen
        name="LearnMain"
        component={LearnScreen}
        options={{ headerShown: false }}
      />
      <LearnStack.Screen name="Category" component={CategoryScreen} options={{ title: '' }} />
      <LearnStack.Screen name="Guide" component={GuideScreen} options={{ title: '' }} />
      <LearnStack.Screen
        name="ContentPacks"
        component={ContentPacksScreen}
        options={{ title: 'Content Packs' }}
      />
      <LearnStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
    </LearnStack.Navigator>
  );
}

function ToolsStackNavigator() {
  return (
    <ToolsStack.Navigator screenOptions={stackScreenOptions}>
      <ToolsStack.Screen
        name="ToolsMain"
        component={ToolsScreen}
        options={{ headerShown: false }}
      />
      <ToolsStack.Screen
        name="Translator"
        component={TranslatorScreen}
        options={{ title: 'Offline Translator' }}
      />
      <ToolsStack.Screen
        name="HamRadio"
        component={HamRadioScreen}
        options={{ title: 'HAM Radio Repeaters' }}
      />
      <ToolsStack.Screen
        name="MorseCode"
        component={MorseCodeScreen}
        options={{ title: 'Morse Code' }}
      />
      <ToolsStack.Screen name="Map" component={MapScreen} options={{ title: 'Offline Map' }} />
      <ToolsStack.Screen name="Guide" component={GuideScreen} options={{ title: '' }} />
      <ToolsStack.Screen name="MyKit" component={MyKitScreen} options={{ title: 'My Kit' }} />
      <ToolsStack.Screen
        name="Flows"
        component={FlowsScreen}
        options={{ title: 'Real-World Flows' }}
      />
      <ToolsStack.Screen
        name="Advisor"
        component={AdvisorScreen}
        options={{ title: 'Field Intelligence' }}
      />
      <ToolsStack.Screen
        name="SurvivalCalculator"
        component={SurvivalCalculatorScreen}
        options={{ title: 'Survival Calculator' }}
      />
      <ToolsStack.Screen
        name="StarMap"
        component={StarMapScreen}
        options={{ title: 'Star Map' }}
      />
      <ToolsStack.Screen
        name="ReadinessScan"
        component={ReadinessScanScreen}
        options={{ title: 'Readiness Scan', headerShown: false }}
      />
      <ToolsStack.Screen
        name="GearInventory"
        component={GearInventoryScreen}
        options={{ title: 'Gear Inventory' }}
      />
      <ToolsStack.Screen
        name="FamilyPlanner"
        component={FamilyPlannerScreen}
        options={{ title: 'Family Emergency Planner' }}
      />
      <ToolsStack.Screen
        name="CoordinateConverter"
        component={CoordinateConverterScreen}
        options={{ title: 'Coordinate Converter' }}
      />
      <ToolsStack.Screen
        name="KnotGuide"
        component={KnotGuideScreen}
        options={{ title: 'Knot Guide' }}
      />
    </ToolsStack.Navigator>
  );
}

function DrillStackNavigator() {
  return (
    <DrillStack.Navigator screenOptions={stackScreenOptions}>
      <DrillStack.Screen
        name="DrillMain"
        component={DrillScreen}
        options={{ headerShown: false }}
      />
      <DrillStack.Screen
        name="QuizPlay"
        component={QuizScreen}
        options={{ title: '', headerShown: false }}
      />
      <DrillStack.Screen
        name="QuizResult"
        component={QuizResultScreen}
        options={{ title: 'Drill Results' }}
      />
    </DrillStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Checklists" component={ChecklistScreen} options={{ title: 'Checklists' }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <MoreStack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <MoreStack.Screen name="Founder" component={FounderScreen} options={{ title: 'About the Founder' }} />
      <MoreStack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Referral Program' }} />
      <MoreStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ title: 'Upgrade', presentation: 'modal' }}
      />
    </MoreStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, { focused: string; outline: string }> = {
  Home:  { focused: 'home',      outline: 'home-outline' },
  Learn: { focused: 'book',      outline: 'book-outline' },
  Tools: { focused: 'construct', outline: 'construct-outline' },
  Drill: { focused: 'fitness',   outline: 'fitness-outline' },
  More:  { focused: 'grid',      outline: 'grid-outline' },
};

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
            const icons = TAB_ICONS[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };
            const iconName = focused ? icons.focused : icons.outline;
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home"  component={HomeStackNavigator} />
        <Tab.Screen name="Learn" component={LearnStackNavigator} />
        <Tab.Screen name="Tools" component={ToolsStackNavigator} />
        <Tab.Screen name="Drill" component={DrillStackNavigator} />
        <Tab.Screen name="More"  component={MoreStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
