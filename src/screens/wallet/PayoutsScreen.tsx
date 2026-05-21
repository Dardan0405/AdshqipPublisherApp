import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getPayouts, requestPayout, getWallet } from '../../api/publisher';
import { Payout } from '../../types/publisher';
import { useTheme, AppColors } from '../../theme';

const statusColor: Record<string, string> = {
  pending: '#f59e0b', approved: '#3b82f6', paid: '#10b981',
  rejected: '#ef4444', cancelled: '#9ca3af',
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: c.card, padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: c.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: c.text },
  balance: { fontSize: 13, color: c.textMuted, marginTop: 2 },
  requestBtn: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  item: { backgroundColor: c.card, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, elevation: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amount: { fontSize: 18, fontWeight: '700', color: c.text },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  method: { fontSize: 13, color: c.textMuted },
  date: { fontSize: 12, color: c.textLight, marginTop: 2 },
  invoice: { fontSize: 12, color: c.textLight, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: c.textLight, fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 4 },
  modalBalance: { fontSize: 13, color: c.textMuted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSub, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, color: c.text, backgroundColor: c.input },
  btn: { backgroundColor: c.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelBtn: { marginTop: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, color: c.textMuted },
});

export default function PayoutsScreen() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [available, setAvailable] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [payoutsRes, walletRes] = await Promise.all([getPayouts(), getWallet()]);
      setPayouts(payoutsRes.data ?? []);
      setAvailable(walletRes.summary?.available ?? walletRes.available ?? null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount.'); return;
    }
    if (available !== null && amt > available) {
      Alert.alert('Error', `Amount exceeds available balance (€${available.toFixed(2)}).`); return;
    }
    setSubmitting(true);
    try {
      await requestPayout({ amount: amt, notes: notes.trim() || undefined });
      setModalVisible(false);
      setAmount('');
      setNotes('');
      Alert.alert('Requested', 'Payout request submitted successfully.');
      load(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to request payout.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Payouts</Text>
          {available !== null && (
            <Text style={s.balance}>Available: €{available.toFixed(2)}</Text>
          )}
        </View>
        <TouchableOpacity style={s.requestBtn} onPress={() => setModalVisible(true)}>
          <Text style={s.requestBtnText}>Request</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={payouts}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={s.itemTop}>
              <Text style={s.amount}>€{item.amount.toFixed(2)}</Text>
              <View style={[s.badge, { backgroundColor: statusColor[item.payout_status] ?? '#9ca3af' }]}>
                <Text style={s.badgeText}>{item.payout_status}</Text>
              </View>
            </View>
            <Text style={s.method}>{item.payment_method} · {item.payment_provider}</Text>
            <Text style={s.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            {item.invoice_number ? <Text style={s.invoice}>Invoice: {item.invoice_number}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No payout requests yet.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Request Payout</Text>
            {available !== null && (
              <Text style={s.modalBalance}>Available balance: €{available.toFixed(2)}</Text>
            )}

            <Text style={s.label}>Amount (EUR)</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor={c.textLight}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={s.label}>Notes (optional)</Text>
            <TextInput
              style={[s.input, { height: 80 }]}
              placeholder="Any notes for this payout..."
              placeholderTextColor={c.textLight}
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={s.btn} onPress={handleRequest} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Submit Request</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
