import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { palette } from '../styles/theme';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { year, month: month - 1, day };
}

function toIsoDate(year, month, day) {
  return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function toBrazilianDate(value) {
  const date = parseIsoDate(value);
  return date ? String(date.day).padStart(2, '0') + '/' + String(date.month + 1).padStart(2, '0') + '/' + date.year : '';
}

export default function DatePickerField({ value, onChange }) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseIsoDate(value);
    const now = new Date();
    return selected || { year: now.getFullYear(), month: now.getMonth(), day: null };
  });

  useEffect(() => {
    const selected = parseIsoDate(value);
    if (selected) setVisibleMonth(selected);
  }, [value]);

  const firstWeekday = (new Date(visibleMonth.year, visibleMonth.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.year, visibleMonth.month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const today = new Date();
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  function shiftMonth(amount) {
    const date = new Date(visibleMonth.year, visibleMonth.month + amount, 1);
    setVisibleMonth({ year: date.getFullYear(), month: date.getMonth(), day: null });
  }

  function chooseDay(day) {
    onChange(toIsoDate(visibleMonth.year, visibleMonth.month, day));
    setCalendarVisible(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Data de entrega (opcional)</Text>
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={[styles.valueButton, !value && styles.placeholderButton]}
          onPress={() => setCalendarVisible((shown) => !shown)}
          accessibilityRole="button"
          accessibilityLabel={value ? 'Data selecionada: ' + toBrazilianDate(value) : 'Selecionar data de entrega'}
          accessibilityState={{ expanded: calendarVisible }}
        >
          <Text style={[styles.valueText, !value && styles.placeholderText]}>
            {value ? toBrazilianDate(value) : 'Selecionar data'}
          </Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => { onChange(''); setCalendarVisible(false); }}
            accessibilityRole="button"
            accessibilityLabel="Limpar data de entrega"
          >
            <Text style={styles.clearText}>Limpar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {calendarVisible ? (
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.monthArrow} onPress={() => shiftMonth(-1)} accessibilityRole="button" accessibilityLabel="Mês anterior">
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[visibleMonth.month]} {visibleMonth.year}</Text>
            <TouchableOpacity style={styles.monthArrow} onPress={() => shiftMonth(1)} accessibilityRole="button" accessibilityLabel="Próximo mês">
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday) => <Text key={weekday} style={styles.weekday}>{weekday}</Text>)}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const isoDay = day ? toIsoDate(visibleMonth.year, visibleMonth.month, day) : '';
              const selected = !!day && isoDay === value;
              const isToday = !!day && isoDay === todayIso;
              return (
                <View key={index} style={styles.dayCell}>
                  {day ? (
                    <TouchableOpacity
                      style={[styles.dayButton, isToday && styles.todayButton, selected && styles.selectedButton]}
                      onPress={() => chooseDay(day)}
                      accessibilityRole="button"
                      accessibilityLabel={String(day) + ' de ' + MONTHS[visibleMonth.month] + ' de ' + visibleMonth.year}
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.dayText, selected && styles.selectedText]}>{day}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { color: palette.texto, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  valueButton: { flex: 1, minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 11, paddingHorizontal: 12, backgroundColor: '#FFFCFD' },
  placeholderButton: { backgroundColor: palette.branco },
  valueText: { color: palette.texto, fontSize: 15 },
  placeholderText: { color: palette.cinzaMedio },
  clearButton: { marginLeft: 10, minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  clearText: { color: palette.bordo, fontSize: 13, fontWeight: '700' },
  calendar: { marginTop: 10, padding: 12, borderWidth: 1, borderColor: '#E4CBD6', borderRadius: 14, backgroundColor: '#FFFCFD' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthArrow: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: palette.rosaSuave },
  arrowText: { color: palette.bordo, fontSize: 24, lineHeight: 28, fontWeight: '700' },
  monthTitle: { color: palette.bordoEscuro, fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: '14.2857%', textAlign: 'center', color: palette.cinzaMedio, fontSize: 11, fontWeight: '700', paddingVertical: 6 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  todayButton: { borderWidth: 1, borderColor: palette.bordo },
  selectedButton: { backgroundColor: palette.bordo },
  dayText: { color: palette.texto, fontSize: 13 },
  selectedText: { color: palette.branco, fontWeight: '700' },
});
