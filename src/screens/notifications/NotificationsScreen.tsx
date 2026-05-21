import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
} from '../../api/publisher';
import { useTheme, AppColors } from '../../theme';

interface Notif {
  id: number;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  earning: '💰', payout: '💸', kyc: '📋', system: '⚙️', alert: '⚠️',
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: c.card, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: c.borderLight,
  },
  topBarTxt: { fontSize: 13, color: c.textMuted },
  markAllTxt: { fontSize: 13, color: c.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTxt: { fontSize: 15, color: c.textLight },
  loadMore: {
    marginHorizontal: 16, marginBottom: 8, padding: 12,
    backgroundColor: c.card, borderRadius: 10, alignItems: 'center',
  },
  loadMoreTxt: { color: c.primary, fontWeight: '600', fontSize: 14 },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: c.card, marginHorizontal: 16, marginTop: 8,
    borderRadius: 12, padding: 14, elevation: 1,
  },
  itemUnread: { backgroundColor: c.primaryBg },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  typeIcon: { fontSize: 16 },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  itemTitle: { flex: 1, fontSize: 14, color: c.textSub },
  itemTitleBold: { fontWeight: '700', color: c.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary, marginLeft: 8 },
  itemMsg: { fontSize: 13, color: c.textMuted, lineHeight: 18, marginBottom: 4 },
  itemTime: { fontSize: 11, color: c.textLight },
});

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const { colors: c } = useTheme();
  const s = makeStyles(c);

  const load = useCallback(async (pg = 1, silent = false) => {
    if (pg === 1 && !silent) setLoading(true);
    try {
      const res = await getNotifications(pg);
      const data: Notif[] = res.data ?? [];
      if (pg === 1) setItems(data);
      else setItems((prev) => [...prev, ...data]);
      setHasMore(!!res.next_page_url);
      setPage(pg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const markRead = async (id: number) => {
    setItems((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    try { await markNotificationRead(id); } catch {}
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } catch {} finally { setMarkingAll(false); }
  };

  const unreadCount = items.filter((n) => !n.read_at).length;

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>;
  }

  return (
    <FlatList
      style={s.container}
      data={items}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(1, true); }}
          tintColor={c.primary}
        />
      }
      ListHeaderComponent={
        unreadCount > 0 ? (
          <View style={s.topBar}>
            <Text style={s.topBarTxt}>{unreadCount} unread</Text>
            <TouchableOpacity onPress={markAll} disabled={markingAll}>
              <Text style={s.markAllTxt}>{markingAll ? 'Marking…' : 'Mark all read'}</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🔔</Text>
          <Text style={s.emptyTxt}>No notifications</Text>
        </View>
      }
      ListFooterComponent={
        hasMore ? (
          <TouchableOpacity style={s.loadMore} onPress={() => load(page + 1, true)}>
            <Text style={s.loadMoreTxt}>Load more</Text>
          </TouchableOpacity>
        ) : <View style={{ height: 24 }} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[s.item, !item.read_at && s.itemUnread]}
          onPress={() => { if (!item.read_at) markRead(item.id); }}
          activeOpacity={item.read_at ? 1 : 0.75}
        >
          <View style={s.iconWrap}>
            <Text style={s.typeIcon}>{TYPE_ICON[item.type] ?? '🔔'}</Text>
          </View>
          <View style={s.itemBody}>
            <View style={s.itemTop}>
              <Text style={[s.itemTitle, !item.read_at && s.itemTitleBold]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read_at && <View style={s.dot} />}
            </View>
            <Text style={s.itemMsg} numberOfLines={2}>{item.message}</Text>
            <Text style={s.itemTime}>{item.created_at?.slice(0, 10)}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
