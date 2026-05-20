import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getOverviewReport, getGeoReport, getSitesReport, getAppsReport,
} from '../../api/publisher';
import {
  ReportOverviewRow, GeoReportRow, SiteReportRow, AppReportRow,
} from '../../types/publisher';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'geo' | 'sites' | 'apps';
type Preset = '7d' | '30d' | 'mtd' | 'last';

interface DateRange { start: string; end: string }

// ── Date helpers ──────────────────────────────────────────────────────────────

function getDateRange(preset: Preset): DateRange {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const sub = (d: Date, days: number) => {
    const r = new Date(d); r.setDate(r.getDate() - days); return r;
  };
  switch (preset) {
    case '7d':  return { start: fmt(sub(now, 7)), end: fmt(now) };
    case '30d': return { start: fmt(sub(now, 30)), end: fmt(now) };
    case 'mtd': return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) };
    case 'last': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: fmt(s), end: fmt(e) };
    }
  }
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d',   label: '7D' },
  { key: '30d',  label: '30D' },
  { key: 'mtd',  label: 'MTD' },
  { key: 'last', label: 'Last M' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'geo',      label: 'Geo' },
  { key: 'sites',    label: 'Sites' },
  { key: 'apps',     label: 'Apps' },
];

// ── Summary chip ──────────────────────────────────────────────────────────────

function SummaryChips({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={s.summaryRow}>
      {items.map((it) => (
        <View key={it.label} style={s.chip}>
          <Text style={s.chipLabel}>{it.label}</Text>
          <Text style={s.chipValue}>{it.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Table headers ─────────────────────────────────────────────────────────────

function OverviewHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.col, { flex: 2 }]}>Date</Text>
      <Text style={s.col}>Imp</Text>
      <Text style={s.col}>Clk</Text>
      <Text style={s.col}>Earn €</Text>
      <Text style={s.col}>eCPM</Text>
    </View>
  );
}

function GeoHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.col, { flex: 2 }]}>Country</Text>
      <Text style={s.col}>Imp</Text>
      <Text style={s.col}>Clk</Text>
      <Text style={s.col}>Earn €</Text>
      <Text style={s.col}>eCPM</Text>
    </View>
  );
}

function SitesHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.col, { flex: 3 }]}>Site</Text>
      <Text style={s.col}>Imp</Text>
      <Text style={s.col}>Clk</Text>
      <Text style={s.col}>Earn €</Text>
    </View>
  );
}

function AppsHeader() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.col, { flex: 3 }]}>App</Text>
      <Text style={s.col}>Imp</Text>
      <Text style={s.col}>Clk</Text>
      <Text style={s.col}>Earn €</Text>
    </View>
  );
}

// ── Row renderers ─────────────────────────────────────────────────────────────

function OverviewRow({ item }: { item: ReportOverviewRow }) {
  return (
    <View style={s.row}>
      <Text style={[s.cell, { flex: 2 }]}>{item.date}</Text>
      <Text style={s.cell}>{Number(item.total_impressions).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_clicks).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_earnings).toFixed(4)}</Text>
      <Text style={s.cell}>{Number(item.ecpm).toFixed(2)}</Text>
    </View>
  );
}

function GeoRow({ item }: { item: GeoReportRow }) {
  return (
    <View style={s.row}>
      <Text style={[s.cell, { flex: 2 }]}>{item.country_code || '—'}</Text>
      <Text style={s.cell}>{Number(item.total_impressions).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_clicks).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_earnings).toFixed(4)}</Text>
      <Text style={s.cell}>{Number(item.ecpm).toFixed(2)}</Text>
    </View>
  );
}

function SiteRow({ item }: { item: SiteReportRow }) {
  return (
    <View style={s.row}>
      <View style={[{ flex: 3 }]}>
        <Text style={[s.cell, { fontWeight: '600' }]} numberOfLines={1}>{item.site_name}</Text>
        <Text style={s.cellSub} numberOfLines={1}>{item.site_domain}</Text>
      </View>
      <Text style={s.cell}>{Number(item.total_impressions).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_clicks).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_earnings).toFixed(4)}</Text>
    </View>
  );
}

function AppRow({ item }: { item: AppReportRow }) {
  return (
    <View style={s.row}>
      <Text style={[s.cell, { flex: 3, fontWeight: '600' }]} numberOfLines={1}>{item.app_name}</Text>
      <Text style={s.cell}>{Number(item.total_impressions).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_clicks).toLocaleString()}</Text>
      <Text style={s.cell}>{Number(item.total_earnings).toFixed(4)}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('overview');
  const [preset, setPreset] = useState<Preset>('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [overviewRows, setOverviewRows] = useState<ReportOverviewRow[]>([]);
  const [overviewSummary, setOverviewSummary] = useState<{
    total_impressions: number; total_clicks: number;
    total_earnings: number; ecpm: number;
  } | null>(null);
  const [geoRows, setGeoRows] = useState<GeoReportRow[]>([]);
  const [siteRows, setSiteRows] = useState<SiteReportRow[]>([]);
  const [appRows, setAppRows] = useState<AppReportRow[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const range = getDateRange(preset);
    try {
      switch (tab) {
        case 'overview': {
          const res = await getOverviewReport(range);
          setOverviewRows(res.data ?? []);
          setOverviewSummary(res.summary ?? null);
          break;
        }
        case 'geo': {
          const res = await getGeoReport(range);
          setGeoRows(res.data ?? []);
          break;
        }
        case 'sites': {
          const res = await getSitesReport(range);
          setSiteRows(res.data ?? []);
          break;
        }
        case 'apps': {
          const res = await getAppsReport(range);
          setAppRows(res.data ?? []);
          break;
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, preset]);

  useEffect(() => { load(); }, [load]);

  const renderHeader = () => (
    <>
      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[s.tabBar, { paddingTop: insets.top }]}
        contentContainerStyle={s.tabBarContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date range chips */}
      <View style={s.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[s.presetChip, preset === p.key && s.presetChipActive]}
            onPress={() => setPreset(p.key)}
          >
            <Text style={[s.presetText, preset === p.key && s.presetTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary chips */}
      {tab === 'overview' && overviewSummary && (
        <SummaryChips items={[
          { label: 'Imp', value: overviewSummary.total_impressions.toLocaleString() },
          { label: 'Clk', value: overviewSummary.total_clicks.toLocaleString() },
          { label: 'Earn', value: `€${overviewSummary.total_earnings.toFixed(2)}` },
          { label: 'eCPM', value: `€${overviewSummary.ecpm.toFixed(2)}` },
        ]} />
      )}

      {/* Table column header */}
      {!loading && (
        tab === 'overview' ? <OverviewHeader />
        : tab === 'geo'    ? <GeoHeader />
        : tab === 'sites'  ? <SitesHeader />
        :                    <AppsHeader />
      )}
    </>
  );

  if (loading) {
    return (
      <View style={s.container}>
        {renderHeader()}
        <View style={s.center}><ActivityIndicator color="#6366f1" /></View>
      </View>
    );
  }

  if (tab === 'overview') {
    return (
      <View style={s.container}>
        <FlatList
          data={overviewRows}
          keyExtractor={(item) => item.date}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <OverviewRow item={item} />}
          ListEmptyComponent={<Text style={s.empty}>No data for this period.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    );
  }

  if (tab === 'geo') {
    return (
      <View style={s.container}>
        <FlatList
          data={geoRows}
          keyExtractor={(item) => item.country_code ?? Math.random().toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <GeoRow item={item} />}
          ListEmptyComponent={<Text style={s.empty}>No geo data for this period.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    );
  }

  if (tab === 'sites') {
    return (
      <View style={s.container}>
        <FlatList
          data={siteRows}
          keyExtractor={(item) => String(item.site_id)}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <SiteRow item={item} />}
          ListEmptyComponent={<Text style={s.empty}>No site data for this period.</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={appRows}
        keyExtractor={(item) => String(item.mobile_app_id)}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <AppRow item={item} />}
        ListEmptyComponent={<Text style={s.empty}>No app data for this period.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#6366f1" />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },

  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tabBtn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  tabBtnActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },

  presetRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  presetChip: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  presetChipActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  presetText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  presetTextActive: { color: '#6366f1' },

  summaryRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#fff', flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#f3f4f6', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  chipLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 1 },
  chipValue: { fontSize: 13, fontWeight: '700', color: '#374151' },

  tableHeader: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    marginTop: 8,
  },
  col: { flex: 1, fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  cell: { flex: 1, fontSize: 13, color: '#374151' },
  cellSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
});
