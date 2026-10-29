import { StyleSheet } from 'react-native';

export const palette = {
  bordo: '#5D1C39',
  bordoEscuro: '#3D102A',
  rosaClaro: '#F9EDF3',
  rosaSuave: '#F6D4E2',
  rosa: '#E9A9C2',
  branco: '#FFFFFF',
  cinzaClaro: '#F5F5F7',
  cinzaMedio: '#7A6A7A',
  texto: '#2F1F2D',
  verde: '#78B89A',
  amarelo: '#F4C76A',
  azul: '#8DB5D8',
  vermelho: '#D7787A',
};

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.rosaClaro,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.texto,
  },
  subtitle: {
    fontSize: 14,
    color: palette.cinzaMedio,
    marginTop: 6,
  },
  card: {
    backgroundColor: palette.branco,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.texto,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: palette.bordo,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: palette.branco,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: palette.rosaSuave,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: palette.bordo,
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
