import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getProfile, updatePersonalInfo } from '../../api/publisher';

export default function PersonalInfoScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        const p = res.profile ?? {};
        setFirstName(p.first_name ?? '');
        setLastName(p.last_name ?? '');
        setGender(p.gender ?? '');
        setDob(p.date_of_birth ?? '');
        setMobile(p.mobile_number ?? '');
        setCity(p.city ?? '');
        setCountry(p.country_code ?? '');
      } catch {
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First and last name are required.');
      return;
    }
    setSaving(true);
    try {
      await updatePersonalInfo({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || undefined,
        date_of_birth: dob || undefined,
        mobile_number: mobile || undefined,
        city: city || undefined,
        country_code: country || undefined,
      });
      Alert.alert('Saved', 'Personal information updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#6366f1" /></View>;

  const GENDERS = ['male', 'female', 'other'];

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>Personal Information</Text>

        <Text style={s.label}>First Name</Text>
        <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="Jane" placeholderTextColor="#9ca3af" />

        <Text style={s.label}>Last Name</Text>
        <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Doe" placeholderTextColor="#9ca3af" />

        <Text style={s.label}>Gender</Text>
        <View style={s.segmentRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity key={g} style={[s.segment, gender === g && s.segmentActive]} onPress={() => setGender(gender === g ? '' : g)}>
              <Text style={[s.segmentTxt, gender === g && s.segmentTxtActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Date of Birth (YYYY-MM-DD)</Text>
        <TextInput style={s.input} value={dob} onChangeText={setDob} placeholder="1990-01-15" placeholderTextColor="#9ca3af" keyboardType="numbers-and-punctuation" />

        <Text style={s.label}>Mobile Number</Text>
        <TextInput style={s.input} value={mobile} onChangeText={setMobile} placeholder="+355 69 000 0000" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />

        <Text style={s.label}>City</Text>
        <TextInput style={s.input} value={city} onChangeText={setCity} placeholder="Tirana" placeholderTextColor="#9ca3af" />

        <Text style={s.label}>Country Code (2 letters)</Text>
        <TextInput style={s.input} value={country} onChangeText={(v) => setCountry(v.toUpperCase().slice(0, 2))} placeholder="AL" placeholderTextColor="#9ca3af" autoCapitalize="characters" maxLength={2} />

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 48 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 15, color: '#111827', backgroundColor: '#fff' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' },
  segmentActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  segmentTxt: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  segmentTxtActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
