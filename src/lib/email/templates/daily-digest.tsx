import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
  Preview,
  Row,
  Column,
  Heading,
} from '@react-email/components';
import * as React from 'react';

export interface BreakCondition {
  rank: number;
  name: string;
  qualityScore: number;
  qualityLabel: string;
  waveHeightFt: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windSpeedMph: number;
  windDirectionDeg: number;
  tideHeightFt: number | null;
  tideState: string | null;
}

interface DailyDigestProps {
  breaks: BreakCondition[];
  unsubscribeUrl: string;
  dashboardUrl?: string;
  date: string;
}

function getLabelColor(label: string): string {
  switch (label) {
    case 'Epic': return '#3B82F6';
    case 'Very Good': return '#22C55E';
    case 'Good': return '#EAB308';
    case 'Fair': return '#F97316';
    case 'Poor': return '#EF4444';
    default: return '#6B7280';
  }
}

function getScoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}

function degreesToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function DailyDigest({ breaks, unsubscribeUrl, dashboardUrl, date }: DailyDigestProps) {
  const topScore = breaks[0]?.qualityScore ?? 0;
  const topLabel = breaks[0]?.qualityLabel ?? '';

  return (
    <Html>
      <Head />
      <Preview>
        {`${topLabel} conditions today — ${breaks[0]?.name} scoring ${topScore}/100`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading as="h1" style={headerTitle}>
              🏄 SurfsUp
            </Heading>
            <Text style={headerDate}>{date}</Text>
          </Section>

          {/* Summary */}
          <Section style={summarySection}>
            <Text style={summaryText}>
              Top spot: <strong>{breaks[0]?.name}</strong> —{' '}
              <span style={{ color: getLabelColor(topLabel) }}>{topLabel}</span> ({topScore}/100)
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Break cards */}
          {breaks.map((brk) => (
            <Section key={brk.rank} style={breakCard}>
              {/* Rank + Name + Score */}
              <Row>
                <Column style={rankCol}>
                  <Text style={rankNumber}>#{brk.rank}</Text>
                </Column>
                <Column style={nameCol}>
                  <Text style={breakName}>{brk.name}</Text>
                  <Text style={{
                    ...labelBadge,
                    color: getLabelColor(brk.qualityLabel),
                  }}>
                    {brk.qualityLabel} — {brk.qualityScore}/100
                  </Text>
                </Column>
              </Row>

              {/* Score bar */}
              <Text style={scoreBar}>{getScoreBar(brk.qualityScore)}</Text>

              {/* Conditions grid */}
              <Row>
                <Column style={condCol}>
                  <Text style={condLabel}>Waves</Text>
                  <Text style={condValue}>{brk.waveHeightFt.toFixed(1)} ft</Text>
                </Column>
                <Column style={condCol}>
                  <Text style={condLabel}>Swell</Text>
                  <Text style={condValue}>{brk.swellPeriodS.toFixed(0)}s {degreesToCompass(brk.swellDirectionDeg)}</Text>
                </Column>
                <Column style={condCol}>
                  <Text style={condLabel}>Wind</Text>
                  <Text style={condValue}>{brk.windSpeedMph.toFixed(0)} mph {degreesToCompass(brk.windDirectionDeg)}</Text>
                </Column>
                <Column style={condCol}>
                  <Text style={condLabel}>Tide</Text>
                  <Text style={condValue}>
                    {brk.tideHeightFt !== null ? `${brk.tideHeightFt.toFixed(1)} ft` : '—'}
                    {brk.tideState ? ` (${brk.tideState})` : ''}
                  </Text>
                </Column>
              </Row>

              <Hr style={cardDivider} />
            </Section>
          ))}

          {/* Footer */}
          <Section style={footer}>
            {dashboardUrl && (
              <Text style={footerText}>
                <Link href={dashboardUrl} style={footerLink}>View full dashboard</Link>
              </Text>
            )}
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={unsubLink}>Unsubscribe</Link>
              {' '}from daily surf reports
            </Text>
            <Text style={footerMuted}>
              Conditions are forecasts and may differ from actual surf. Always check conditions before entering the water.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// --- Styles ---
const body: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const header: React.CSSProperties = {
  backgroundColor: '#0c4a6e',
  padding: '24px 32px 16px',
  textAlign: 'center' as const,
};

const headerTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const headerDate: React.CSSProperties = {
  color: '#bae6fd',
  fontSize: '14px',
  margin: 0,
};

const summarySection: React.CSSProperties = {
  padding: '16px 32px 8px',
};

const summaryText: React.CSSProperties = {
  fontSize: '16px',
  color: '#18181b',
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '8px 32px',
};

const breakCard: React.CSSProperties = {
  padding: '12px 32px 4px',
};

const rankCol: React.CSSProperties = {
  width: '44px',
  verticalAlign: 'top',
};

const rankNumber: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#0c4a6e',
  margin: 0,
};

const nameCol: React.CSSProperties = {
  verticalAlign: 'top',
};

const breakName: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#18181b',
  margin: '0 0 2px',
};

const labelBadge: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  margin: 0,
};

const scoreBar: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '14px',
  color: '#0c4a6e',
  margin: '4px 0 8px',
  letterSpacing: '1px',
};

const condCol: React.CSSProperties = {
  width: '25%',
  verticalAlign: 'top',
};

const condLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#71717a',
  textTransform: 'uppercase' as const,
  margin: '0 0 2px',
  letterSpacing: '0.5px',
};

const condValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#18181b',
  margin: 0,
};

const cardDivider: React.CSSProperties = {
  borderColor: '#f4f4f5',
  margin: '12px 0 4px',
};

const footer: React.CSSProperties = {
  padding: '16px 32px 24px',
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#71717a',
  margin: '4px 0',
};

const footerLink: React.CSSProperties = {
  color: '#0c4a6e',
  textDecoration: 'underline',
};

const unsubLink: React.CSSProperties = {
  color: '#a1a1aa',
  textDecoration: 'underline',
};

const footerMuted: React.CSSProperties = {
  fontSize: '11px',
  color: '#a1a1aa',
  margin: '12px 0 0',
};
