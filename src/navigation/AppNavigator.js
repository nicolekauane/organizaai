import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import SubjectsScreen from '../screens/SubjectsScreen';
import { palette } from '../styles/theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFF7FA',
        },
        headerTitleStyle: {
          color: palette.bordoEscuro,
          fontWeight: '700',
        },
        headerTintColor: palette.bordo,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Tarefas' }}
      />
      <Stack.Screen
        name="Subjects"
        component={SubjectsScreen}
        options={{ title: 'Matérias' }}
      />
    </Stack.Navigator>
  );
}
