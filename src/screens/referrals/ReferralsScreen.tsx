import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Share, RefreshControl } from 'react-native';
import { getReferrals } from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: c.card, padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  title: { fontSize: 20, fontWeight: '700', color: c.text },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: c.card, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 1 },
  statVal: { fontSize: 18, fontWeight: '700', color: c.primary },
  statLbl: { fontSize: 11, color: c.textLight, marginTop: 2 },
  section: { backgroundColor: c.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: c.textSub, marginBottom: 8 },
  sectionTitle2: { fontSize: 16, fontWeight: '700', color: c.textSub, marginHorizontal: 16, marginBottom: 8 },
  link: { fontSize: 12, color: c.primary, marginBottom: 10 },
  shareBtn: { backgroundColor: c.primary, borderRadius: 8, padding: 10, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  item: { backgroundColor: c.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, elevation: 1 },
  name: { fontSize: 14, fontWeight: '600', color: c.text },
  email: { fontSize: 12, color: c.textLight, marginTop: 2 },
  income: { fontSize: 12, color: c.success, marginTop: 4 },
});

export default function ReferralsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try { setData(await getReferrals()); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const share = async (link: string) => {
    await Share.share({ message: `Join Adshqip as a publisher: ${link}` });
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} /></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={c.primary} />}>
      <View style={s.header}><Text style={s.title}>Referrals</Text></View>

      <View style={s.statsRow}>
        <View style={s.statCard}><Text style={s.statVal}>€{(data?.stats?.total_referral_income ?? 0).toFixed(2)}</Text><Text style={s.statLbl}>Income</Text></View>
        <View style={s.statCard}><Text style={s.statVal}>{data?.stats?.total_advertiser_referrals ?? 0}</Text><Text style={s.statLbl}>Advertisers</Text></View>
        <View style={s.statCard}><Text style={s.statVal}>{data?.stats?.total_publisher_referrals ?? 0}</Text><Text style={s.statLbl}>Publishers</Text></View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Advertiser Link</Text>
        <Text style={s.link} numberOfLines={1}>{data?.referral_link}</Text>
        <TouchableOpacity style={s.shareBtn} onPress={() => share(data?.referral_link)}>
          <Text style={s.shareBtnText}>Share Link</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Publisher Link</Text>
        <Text style={s.link} numberOfLines={1}>{data?.publisher_referral_link}</Text>
        <TouchableOpacity style={s.shareBtn} onPress={() => share(data?.publisher_referral_link)}>
          <Text style={s.shareBtnText}>Share Link</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle2}>Referrals ({data?.total ?? 0})</Text>
      {(data?.data ?? []).map((row: any, i: number) => (
        <View key={i} style={s.item}>
          <Text style={s.name}>{row.name}</Text>
          <Text style={s.email}>{row.email} · {row.role}</Text>
          <Text style={s.income}>Income: €{row.referral_income.toFixed(4)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
