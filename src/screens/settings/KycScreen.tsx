import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getKyc, submitKyc } from '../../api/publisher';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KycDoc { type: string; uri: string; name: string; mimeType: string }

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  not_started: { color: '#6b7280', bg: '#f3f4f6', label: 'Not Started' },
  pending:     { color: '#f59e0b', bg: '#fffbeb', label: 'Pending Review' },
  in_review:   { color: '#3b82f6', bg: '#eff6ff', label: 'In Review' },
  approved:    { color: '#10b981', bg: '#f0fdf4', label: 'Approved' },
  rejected:    { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
  expired:     { color: '#9ca3af', bg: '#f9fafb', label: 'Expired' },
};

const LEVELS = ['basic', 'standard', 'enhanced'];
const ID_TYPES = [
  { key: 'passport',          label: 'Passport' },
  { key: 'national_id',       label: 'National ID' },
  { key: 'drivers_license',   label: 'Driver License' },
  { key: 'residence_permit',  label: 'Residence Permit' },
];
const DOC_TYPES = [
  { key: 'id_front',   label: 'ID Front' },
  { key: 'id_back',    label: 'ID Back' },
  { key: 'selfie',     label: 'Selfie' },
  { key: 'passport',   label: 'Passport' },
  { key: 'proof_of_address', label: 'Proof of Address' },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function KycScreen() {
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [level, setLevel] = useState('basic');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('passport');
  const [idNumber, setIdNumber] = useState('');
  const [docs, setDocs] = useState<KycDoc[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getKyc();
      setKycData(res);
      if (res.current) {
        setFirstName(res.current.legal_first_name ?? '');
        setLastName(res.current.legal_last_name ?? '');
        setDob(res.current.date_of_birth ?? '');
        setNationality(res.current.nationality ?? '');
        setIdType(res.current.id_type ?? 'passport');
        setIdNumber(res.current.id_number ?? '');
        setLevel(res.current.verification_level ?? 'basic');
      }
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async (docType: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setDocs((prev) => {
      const filtered = prev.filter((d) => d.type !== docType);
      return [...filtered, {
        type: docType,
        uri: asset.uri,
        name: asset.fileName ?? `${docType}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      }];
    });
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) { Alert.alert('Validation', 'Legal first name is required.'); return; }
    if (!lastName.trim()) { Alert.alert('Validation', 'Legal last name is required.'); return; }

    const formData = new FormData();
    formData.append('verification_level', level);
    formData.append('legal_first_name', firstName.trim());
    formData.append('legal_last_name', lastName.trim());
    if (dob) formData.append('date_of_birth', dob);
    if (nationality) formData.append('nationality', nationality.toUpperCase().slice(0, 2));
    formData.append('id_type', idType);
    if (idNumber) formData.append('id_number', idNumber.trim());

    docs.forEach((doc, i) => {
      formData.append(`document_types[${i}]`, doc.type);
      formData.append(`documents[${i}]`, { uri: doc.uri, name: doc.name, type: doc.mimeType } as any);
    });

    setSubmitting(true);
    try {
      await submitKyc(formData);
      Alert.alert('Submitted', 'Your KYC verification has been submitted for review.');
      setShowForm(false);
      setLoading(true);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Submission failed.';
      Alert.alert('Error', String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  const status = kycData?.kyc_status ?? 'not_started';
  const meta = STATUS_META[status] ?? STATUS_META.not_started;
  const isApproved = status === 'approved';

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {/* Status banner */}
        <View style={[s.statusBanner, { backgroundColor: meta.bg, borderColor: meta.color + '44' }]}>
          <View style={[s.statusDot, { backgroundColor: meta.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            {kycData?.current?.submitted_at && (
              <Text style={s.statusSub}>
                Submitted: {kycData.current.submitted_at.slice(0, 10)}
              </Text>
            )}
            {kycData?.current?.rejection_reason && (
              <Text style={[s.statusSub, { color: '#ef4444' }]}>
                Reason: {kycData.current.rejection_reason}
              </Text>
            )}
          </View>
          <Text style={[s.levelBadge, { color: meta.color }]}>
            {(kycData?.kyc_level ?? 'none').toUpperCase()}
          </Text>
        </View>

        {/* Current submission info */}
        {kycData?.current && !showForm && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Current Submission</Text>
            <InfoRow label="Level" value={kycData.current.verification_level} />
            <InfoRow label="Name" value={`${kycData.current.legal_first_name ?? ''} ${kycData.current.legal_last_name ?? ''}`.trim() || '—'} />
            <InfoRow label="ID Type" value={kycData.current.id_type ?? '—'} />
            <InfoRow label="Nationality" value={kycData.current.nationality ?? '—'} />
            {kycData.current.documents?.length > 0 && (
              <View style={s.docList}>
                {kycData.current.documents.map((d: any) => (
                  <View key={d.id} style={s.docBadge}>
                    <Text style={s.docBadgeTxt}>{d.document_type} · {d.status}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action button */}
        {!isApproved && !showForm && (
          <TouchableOpacity style={s.primaryBtn} onPress={() => setShowForm(true)}>
            <Text style={s.primaryBtnTxt}>
              {kycData?.current ? 'Update Verification' : 'Start Verification'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Submission form */}
        {showForm && (
          <View style={s.form}>
            <Text style={s.formTitle}>Verification Details</Text>

            <Text style={s.label}>Level</Text>
            <View style={s.chipRow}>
              {LEVELS.map((lv) => (
                <TouchableOpacity key={lv} style={[s.chip, level === lv && s.chipActive]} onPress={() => setLevel(lv)}>
                  <Text style={[s.chipTxt, level === lv && s.chipTxtActive]}>
                    {lv.charAt(0).toUpperCase() + lv.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Legal First Name</Text>
            <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#9ca3af" />

            <Text style={s.label}>Legal Last Name</Text>
            <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#9ca3af" />

            <Text style={s.label}>Date of Birth</Text>
            <TextInput style={s.input} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" />

            <Text style={s.label}>Nationality (2-letter code)</Text>
            <TextInput style={s.input} value={nationality} onChangeText={setNationality} placeholder="AL" autoCapitalize="characters" maxLength={2} placeholderTextColor="#9ca3af" />

            <Text style={s.label}>ID Type</Text>
            <View style={s.chipRow}>
              {ID_TYPES.map((t) => (
                <TouchableOpacity key={t.key} style={[s.chip, idType === t.key && s.chipActive]} onPress={() => setIdType(t.key)}>
                  <Text style={[s.chipTxt, idType === t.key && s.chipTxtActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>ID Number</Text>
            <TextInput style={s.input} value={idNumber} onChangeText={setIdNumber} placeholder="AB123456" placeholderTextColor="#9ca3af" />

            <Text style={s.label}>Documents</Text>
            {DOC_TYPES.map((dt) => {
              const picked = docs.find((d) => d.type === dt.key);
              return (
                <TouchableOpacity key={dt.key} style={[s.docPicker, picked && s.docPickerDone]} onPress={() => pickDocument(dt.key)}>
                  <Text style={[s.docPickerLabel, picked && { color: '#10b981' }]}>{dt.label}</Text>
                  <Text style={s.docPickerStatus}>{picked ? `✓ ${picked.name}` : 'Tap to pick'}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={s.primaryBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnTxt}>Submit Verification</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: '700' },
  statusSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  levelBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  infoLabel: { fontSize: 13, color: '#9ca3af' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  docList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  docBadge: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  docBadgeTxt: { fontSize: 11, color: '#374151' },

  primaryBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginBottom: 8 },
  cancelTxt: { fontSize: 14, color: '#9ca3af' },

  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12,
    marginBottom: 16, fontSize: 14, color: '#111827', backgroundColor: '#f9fafb',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipTxt: { fontSize: 13, color: '#374151' },
  chipTxtActive: { color: '#fff', fontWeight: '600' },
  docPicker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, marginBottom: 8, backgroundColor: '#f9fafb',
  },
  docPickerDone: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  docPickerLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  docPickerStatus: { fontSize: 12, color: '#9ca3af' },
});
