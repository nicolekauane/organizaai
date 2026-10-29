import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SubjectItem from '../components/SubjectItem';
import { subjectList } from '../services/mockData';
import { palette, sharedStyles } from '../styles/theme';

export default function SubjectsScreen({ navigation }) {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={sharedStyles.container}>
        <View style={styles.headerRow}>
          <Text style={sharedStyles.title}>Matérias</Text>
          <TouchableOpacity style={sharedStyles.secondaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={sharedStyles.secondaryButtonText}>Início</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.summary}>Acompanhe o andamento das suas disciplinas.</Text>

        {subjectList.map((subject) => (
          <SubjectItem key={subject.id} subject={subject} />
        ))}

        <TouchableOpacity style={sharedStyles.primaryButton} onPress={() => navigation.navigate('Tasks')}>
          <Text style={sharedStyles.primaryButtonText}>Ver tarefas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summary: {
    fontSize: 14,
    color: palette.cinzaMedio,
    marginBottom: 18,
  },
});
