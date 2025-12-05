import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Svg, { Circle, Path, Line, Text as SvgText, Rect } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { usePinchZoomGesture } from "@/hooks/useGestures";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const CHART_HEIGHT = 200;

type Period = "today" | "week" | "month" | "year";

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesTrend: { date: string; amount: number }[];
  categoryDistribution: { name: string; value: number; color: string }[];
}

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [period, setPeriod] = useState<Period>("week");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", period],
  });

  const mockData: AnalyticsData = useMemo(() => ({
    totalSales: 125600,
    totalOrders: 342,
    averageOrderValue: 367,
    topProducts: [
      { name: "Paracetamol 500mg", quantity: 450, revenue: 22500 },
      { name: "Amoxicillin 250mg", quantity: 280, revenue: 19600 },
      { name: "Omeprazole 20mg", quantity: 220, revenue: 15400 },
      { name: "Metformin 500mg", quantity: 180, revenue: 12600 },
      { name: "Atorvastatin 10mg", quantity: 150, revenue: 10500 },
    ],
    salesTrend: [
      { date: "Mon", amount: 15000 },
      { date: "Tue", amount: 18000 },
      { date: "Wed", amount: 22000 },
      { date: "Thu", amount: 19000 },
      { date: "Fri", amount: 25000 },
      { date: "Sat", amount: 16000 },
      { date: "Sun", amount: 10600 },
    ],
    categoryDistribution: [
      { name: "Antibiotics", value: 35, color: "#4CAF50" },
      { name: "Pain Relief", value: 25, color: "#2196F3" },
      { name: "Cardiac", value: 20, color: "#F44336" },
      { name: "Vitamins", value: 12, color: "#FF9800" },
      { name: "Others", value: 8, color: "#9C27B0" },
    ],
  }), []);

  const data = analytics || mockData;

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodTabs}>
          {periods.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                styles.periodTab,
                period === p.key && { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: period === p.key ? "#FFFFFF" : theme.textSecondary }}
              >
                {p.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInUp.delay(100)} style={{ flex: 1 }}>
            <StatCard
              icon="dollar-sign"
              label="Total Sales"
              value={`Rs ${data.totalSales.toLocaleString()}`}
              color={theme.accent}
            />
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200)} style={{ flex: 1 }}>
            <StatCard
              icon="shopping-bag"
              label="Orders"
              value={data.totalOrders.toString()}
              color={theme.primary}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <StatCard
            icon="trending-up"
            label="Avg Order Value"
            value={`Rs ${data.averageOrderValue.toLocaleString()}`}
            color="#FF9800"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.chartCard}>
            <ThemedText type="h4" style={styles.chartTitle}>Sales Trend</ThemedText>
            <SalesTrendChart data={data.salesTrend} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)}>
          <Card style={styles.chartCard}>
            <ThemedText type="h4" style={styles.chartTitle}>Category Distribution</ThemedText>
            <PieChart data={data.categoryDistribution} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)}>
          <Card style={styles.chartCard}>
            <ThemedText type="h4" style={styles.chartTitle}>Top Products</ThemedText>
            {data.topProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {product.name}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {product.quantity} sold
                  </ThemedText>
                </View>
                <ThemedText type="body" style={{ color: theme.accent, fontWeight: "600" }}>
                  Rs {product.revenue.toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </Card>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  value: string;
  color: string;
}) {
  const { theme } = useTheme();
  
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <ThemedText type="h4" style={{ marginTop: 4 }}>
        {value}
      </ThemedText>
    </Card>
  );
}

function SalesTrendChart({ data }: { data: { date: string; amount: number }[] }) {
  const { theme } = useTheme();
  const { gesture, scale } = usePinchZoomGesture({ minScale: 1, maxScale: 2 });
  
  const maxValue = Math.max(...data.map(d => d.amount));
  const padding = { left: 40, right: 20, top: 20, bottom: 30 };
  const chartWidth = CHART_WIDTH - padding.left - padding.right;
  const chartHeight = CHART_HEIGHT - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i * chartWidth) / (data.length - 1),
    y: padding.top + chartHeight - (d.amount / maxValue) * chartHeight,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, "");

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <React.Fragment key={i}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={CHART_WIDTH - padding.right}
                  y2={y}
                  stroke={theme.border}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={padding.left - 8}
                  y={y + 4}
                  fontSize={10}
                  fill={theme.textSecondary}
                  textAnchor="end"
                >
                  {Math.round(maxValue * ratio / 1000)}k
                </SvgText>
              </React.Fragment>
            );
          })}

          <Path
            d={pathD}
            stroke={theme.primary}
            strokeWidth={3}
            fill="none"
          />

          {points.map((point, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={5}
                fill={theme.primary}
              />
              <SvgText
                x={point.x}
                y={CHART_HEIGHT - 8}
                fontSize={10}
                fill={theme.textSecondary}
                textAnchor="middle"
              >
                {data[i].date}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

function PieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const { theme } = useTheme();
  const size = Math.min(CHART_WIDTH - 100, 200);
  const radius = size / 2 - 10;
  const center = size / 2;

  let currentAngle = -90;

  const slices = data.map((item) => {
    const angle = (item.value / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathD = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return { ...item, pathD };
  });

  return (
    <View style={styles.pieContainer}>
      <Svg width={size} height={size}>
        {slices.map((slice, i) => (
          <Path key={i} d={slice.pathD} fill={slice.color} />
        ))}
        <Circle cx={center} cy={center} r={radius * 0.5} fill={theme.cardBackground} />
      </Svg>
      <View style={styles.legend}>
        {data.map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <ThemedText type="caption">{item.name}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {item.value}%
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  periodTabs: {
    flexDirection: "row",
    backgroundColor: "transparent",
    gap: Spacing.sm,
  },
  periodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    padding: Spacing.lg,
    alignItems: "flex-start",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  chartCard: {
    padding: Spacing.lg,
  },
  chartTitle: {
    marginBottom: Spacing.lg,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  productInfo: {
    flex: 1,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legend: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
});
