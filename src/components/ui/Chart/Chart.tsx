import { StyleSheet, View } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import Svg, { Circle, Path, Rect, Line as SvgLine, Text as SvgText } from 'react-native-svg'

import Typography from '../Typography/Typography'
import { chartTheme, transactionTypeColors } from './Chart.theme'
import type { ChartProps } from './Chart.types'

const styles = StyleSheet.create({
  chart: {
    width: '100%',
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  canvas: {
    width: '100%',
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: chartTheme.colors.typographyActive,
  },
})

type ChartRow = Record<string, unknown>

type GiftedPiePoint = {
  value: number
  color: string
  text?: string
}

const getValue = (entry: ChartRow, key: string | undefined) => {
  const value = key ? entry[key] : undefined
  return typeof value === 'number' ? value : Number(value) || 0
}

const getLabel = (entry: ChartRow, key: string | undefined) => {
  const value = key ? entry[key] : undefined
  return value === undefined || value === null ? '' : String(value)
}

const formatValueK = (val: number) => {
  if (val === 0) return 'R$ 0'
  const abs = Math.abs(val)
  if (abs >= 1000) {
    return `R$ ${(val / 1000).toFixed(0)}K`
  }
  return `R$ ${val}`
}

function Legend({ series }: { series: { key: string; name: string; color: string }[] }) {
  return (
    <View style={styles.legend}>
      {series.map((item) => (
        <View key={item.key} style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: item.color },
            ]}
          />
          <Typography variant="body-sm" style={styles.legendText}>
            {item.name}
          </Typography>
        </View>
      ))}
    </View>
  )
}

export default function Chart({
  title,
  data,
  series = [],
  axis,
  type = 'line',
}: ChartProps) {
  const rows = (data as ChartRow[]) || []
  const labelKey = axis?.x?.key
  const valueKey = series[0]?.key || 'value'

  // Renderização do Gráfico de Pizza
  if (type === 'pie') {
    const piePoints: GiftedPiePoint[] = rows.length > 0
      ? rows.map((entry) => {
          const name = getLabel(entry, 'name') || 'Outros'
          const color = (transactionTypeColors as Record<string, string>)[name] || chartTheme.colors.primary
          return {
            value: getValue(entry, 'value'),
            color,
            text: '',
          }
        })
      : [{ value: 1, color: chartTheme.colors.tertiary }]

    const pieLegend = rows.map((entry) => {
      const name = getLabel(entry, 'name') || 'Outros'
      const color = (transactionTypeColors as Record<string, string>)[name] || chartTheme.colors.primary
      return {
        key: name,
        name,
        color,
      }
    })

    return (
      <View style={styles.chart}>
        <Typography variant="title-sm" color="active" weight="bold" style={styles.title}>
          {title}
        </Typography>
        <View style={styles.canvas}>
          <PieChart data={piePoints} donut={false} radius={85} innerRadius={0} />
        </View>
        <Legend series={pieLegend} />
      </View>
    )
  }

  // Renderização do Gráfico de Barras (Fluxo de Caixa) via SVG
  if (type === 'bar') {
    const svgWidth = 300
    const svgHeight = 180
    const paddingLeft = 45
    const paddingRight = 15
    const paddingTop = 25
    const paddingBottom = 30

    const chartWidth = svgWidth - paddingLeft - paddingRight
    const chartHeight = svgHeight - paddingTop - paddingBottom

    // Encontra o valor máximo para a escala do eixo Y
    const allValues: number[] = []
    rows.forEach((row) => {
      series.forEach((s) => {
        allValues.push(getValue(row, s.key))
      })
    })

    const rawMax = allValues.length ? Math.max(...allValues, 10) : 10
    const maxVal = rawMax * 1.15
    const range = maxVal === 0 ? 1 : maxVal

    const getY = (val: number) => paddingTop + chartHeight - (val / range) * chartHeight

    const gridSections = 4
    const gridLines = Array.from({ length: gridSections + 1 }, (_, i) => {
      const val = (range / gridSections) * i
      const y = getY(val)
      return { val, y }
    })

    const groupWidth = chartWidth / (rows.length || 1)

    return (
      <View style={styles.chart}>
        <Typography variant="title-sm" color="active" weight="bold" style={styles.title}>
          {title}
        </Typography>

        <View style={styles.canvas}>
          <Svg width={svgWidth} height={svgHeight}>
            {/* Linhas de Grade e Eixo Y */}
            {gridLines.map((line, idx) => (
              <g key={idx}>
                <SvgLine
                  x1={paddingLeft}
                  y1={line.y}
                  x2={svgWidth - paddingRight}
                  y2={line.y}
                  stroke={chartTheme.colors.grid}
                  strokeDasharray="4, 4"
                  strokeWidth="1"
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={line.y + 3}
                  fill={chartTheme.colors.typographyActive}
                  fontSize="8"
                  fontFamily="Inter_400Regular"
                  textAnchor="end"
                >
                  {formatValueK(Math.round(line.val))}
                </SvgText>
              </g>
            ))}

            {/* Barras Agrupadas por Mês */}
            {rows.map((row, groupIndex) => {
              const groupX = paddingLeft + groupIndex * groupWidth
              const label = getLabel(row, labelKey)
              const barWidth = Math.min(16, (groupWidth - 16) / series.length)

              return (
                <g key={groupIndex}>
                  {series.map((s, barIndex) => {
                    const val = getValue(row, s.key)
                    const barHeight = (val / range) * chartHeight
                    const barX = groupX + 8 + barIndex * (barWidth + 4)
                    const barY = paddingTop + chartHeight - barHeight
                    const barColor = s.color || chartTheme.colors.primary

                    return (
                      <g key={s.key}>
                        <Rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={Math.max(barHeight, 2)}
                          fill={barColor}
                          rx={3}
                        />
                      </g>
                    )
                  })}

                  {/* Rótulo do Eixo X (Mês) */}
                  <SvgText
                    x={groupX + groupWidth / 2}
                    y={svgHeight - 8}
                    fill={chartTheme.colors.typographyActive}
                    fontSize="9"
                    fontFamily="Inter_400Regular"
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                </g>
              )
            })}
          </Svg>
        </View>

        {series.length > 0 ? (
          <Legend
            series={series.map((s) => ({
              key: s.key,
              name: s.name,
              color: s.color ?? chartTheme.colors.primary,
            }))}
          />
        ) : null}
      </View>
    )
  }

  // Fallback para Linha (Evolução do Saldo Acumulado já ajustada)
  const points = rows.map((row) => ({
    value: getValue(row, valueKey),
    label: getLabel(row, labelKey),
  }))

  const svgWidth = 300
  const svgHeight = 160
  const paddingLeft = 50
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const values = points.map((p) => p.value)
  const rawMin = values.length ? Math.min(...values, 0) : 0
  const rawMax = values.length ? Math.max(...values, 10) : 10

  const minVal = rawMin < 0 ? rawMin * 1.15 : 0
  const maxVal = rawMax > 0 ? rawMax * 1.15 : 10
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal

  const getY = (val: number) => paddingTop + chartHeight - ((val - minVal) / range) * chartHeight
  const getX = (index: number) => {
    if (points.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (points.length - 1)) * chartWidth
  }

  const pathD = points.reduce((acc, pt, i) => {
    const x = getX(i)
    const y = getY(pt.value)
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  const gridSections = 4
  const gridLines = Array.from({ length: gridSections + 1 }, (_, i) => {
    const val = minVal + (range / gridSections) * i
    const y = getY(val)
    return { val, y }
  })

  return (
    <View style={styles.chart}>
      <Typography variant="title-sm" color="active" weight="bold" style={styles.title}>
        {title}
      </Typography>

      <View style={styles.canvas}>
        <Svg width={svgWidth} height={svgHeight}>
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <SvgLine
                x1={paddingLeft}
                y1={line.y}
                x2={svgWidth - paddingRight}
                y2={line.y}
                stroke={chartTheme.colors.grid}
                strokeDasharray="4, 4"
                strokeWidth="1"
              />
              <SvgText
                x={paddingLeft - 8}
                y={line.y + 4}
                fill={chartTheme.colors.typographyActive}
                fontSize="10"
                fontFamily="Inter_400Regular"
                textAnchor="end"
              >
                {formatValueK(Math.round(line.val))}
              </SvgText>
            </g>
          ))}

          {points.length > 1 && (
            <Path d={pathD} fill="none" stroke={chartTheme.colors.primary} strokeWidth="3" />
          )}

          {points.map((pt, index) => {
            const x = getX(index)
            const y = getY(pt.value)
            return (
              <g key={index}>
                <Circle cx={x} cy={y} r="5" fill={chartTheme.colors.primary} />
                <SvgText
                  x={x}
                  y={svgHeight - 8}
                  fill={chartTheme.colors.typographyActive}
                  fontSize="10"
                  fontFamily="Inter_400Regular"
                  textAnchor="middle"
                >
                  {pt.label}
                </SvgText>
              </g>
            )
          })}
        </Svg>
      </View>

      {series.length > 0 ? (
        <Legend
          series={series.map((s) => ({
            key: s.key,
            name: s.name,
            color: s.color ?? chartTheme.colors.primary,
          }))}
        />
      ) : null}
    </View>
  )
}