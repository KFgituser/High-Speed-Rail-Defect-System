import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageToggle from './LanguageToggle.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import '../styles/dashboard.css';

const navigationItems = [
  { label: 'overview', icon: 'fa-map', path: '/dashboard' },
  { label: 'realtime', icon: 'fa-triangle-exclamation' },
  { label: 'query', icon: 'fa-magnifying-glass', path: '/query' },
  { label: 'analysis2d', icon: 'fa-cube', path: '/visualization/2d' },
  { label: 'analysis3d', icon: 'fa-cubes', path: '/visualization/3d' },
  { label: 'analytics', icon: 'fa-chart-column' },
  { label: 'devices', icon: 'fa-display' },
  { label: 'reports', icon: 'fa-rectangle-list' },
  { label: 'system', icon: 'fa-gear' }
];

const alarmItems = [
  { km: 'DK512+300', line: 'left', type: 'railCorrugation', time: '10:22:31', level: 'severe', tone: 'danger' },
  { km: 'DK1023+100', line: 'left', type: 'fastenerLoose', time: '10:18:05', level: 'severe', tone: 'danger' },
  { km: 'DK612+650', line: 'left', type: 'railVibration', time: '10:15:42', level: 'moderate', tone: 'warning' },
  { km: 'DK1336+500', line: 'right', type: 'sleeperAnomaly', time: '10:12:17', level: 'moderate', tone: 'warning' },
  { km: 'DK428+900', line: 'left', type: 'minorFluctuation', time: '10:09:54', level: 'minor', tone: 'info' },
  { km: 'DK965+200', line: 'right', type: 'minorFluctuation', time: '10:07:33', level: 'minor', tone: 'info' }
];

const detectionRows = [
  ['AL20240518001', '512+300', 'right', 'railCorrugation', 'severe', '10:22:31', 'pending'],
  ['AL20240518002', '1023+100', 'left', 'fastenerLoose', 'severe', '10:18:05', 'processing'],
  ['AL20240518003', '612+650', 'left', 'railVibration', 'moderate', '10:15:42', 'pending'],
  ['AL20240518004', '1336+500', 'right', 'sleeperAnomaly', 'moderate', '10:12:17', 'pending'],
  ['AL20240518005', '428+900', 'left', 'minorFluctuation', 'minor', '10:09:54', 'recorded'],
  ['AL20240518006', '965+200', 'right', 'minorFluctuation', 'minor', '10:07:33', 'recorded']
];

const railwayRoutes = [
  {
    id: 'jinghu',
    name: { zh: '京沪高铁', en: 'Beijing–Shanghai HSR' },
    mileage: 'DK0+000 ~ DK1318+000',
    stations: [
      { x: 28, y: 112, label: { zh: '北京南', en: 'Beijing S.' }, terminal: true },
      { x: 72, y: 126, label: { zh: '天津南', en: 'Tianjin S.' } },
      { x: 152, y: 132, label: { zh: '济南西', en: 'Jinan W.' } },
      { x: 224, y: 147, label: { zh: '泰安', en: "Tai'an" } },
      { x: 272, y: 145, label: { zh: '曲阜东', en: 'Qufu E.' } },
      { x: 350, y: 145, label: { zh: '枣庄', en: 'Zaozhuang' } },
      { x: 430, y: 157, label: { zh: '徐州东', en: 'Xuzhou E.' } },
      { x: 540, y: 183, label: { zh: '蚌埠南', en: 'Bengbu S.' } },
      { x: 656, y: 166, label: { zh: '镇江南', en: 'Zhenjiang S.' } },
      { x: 738, y: 197, label: { zh: '常州北', en: 'Changzhou N.' } },
      { x: 770, y: 192, label: { zh: '无锡东', en: 'Wuxi E.' } },
      { x: 816, y: 208, label: { zh: '苏州北', en: 'Suzhou N.' } },
      { x: 914, y: 233, label: { zh: '上海虹桥', en: 'Shanghai Hongqiao' }, terminal: true }
    ],
    alerts: [
      { x: 252, y: 120, label: 'DK512+300', tone: 'danger' },
      { x: 361, y: 119, tone: 'danger' },
      { x: 480, y: 132, label: 'DK612+650', tone: 'danger' },
      { x: 605, y: 144, label: 'DK1023+100', tone: 'warning' }
    ]
  },
  {
    id: 'hukun',
    name: { zh: '沪昆高铁', en: 'Shanghai–Kunming HSR' },
    mileage: 'DK0+000 ~ DK2252+000',
    stations: [
      { x: 28, y: 155, label: { zh: '上海虹桥', en: 'Shanghai Hongqiao' }, terminal: true },
      { x: 125, y: 140, label: { zh: '杭州东', en: 'Hangzhou E.' } },
      { x: 235, y: 165, label: { zh: '金华', en: 'Jinhua' } },
      { x: 345, y: 142, label: { zh: '上饶', en: 'Shangrao' } },
      { x: 455, y: 170, label: { zh: '南昌西', en: 'Nanchang W.' } },
      { x: 570, y: 150, label: { zh: '长沙南', en: 'Changsha S.' } },
      { x: 685, y: 182, label: { zh: '怀化南', en: 'Huaihua S.' } },
      { x: 800, y: 165, label: { zh: '贵阳北', en: 'Guiyang N.' } },
      { x: 914, y: 195, label: { zh: '昆明南', en: 'Kunming S.' }, terminal: true }
    ],
    alerts: [
      { x: 210, y: 140, label: 'DK328+500', tone: 'danger' },
      { x: 385, y: 128, label: 'DK786+200', tone: 'warning' },
      { x: 610, y: 137, label: 'DK1456+800', tone: 'danger' },
      { x: 825, y: 147, label: 'DK1968+300', tone: 'warning' }
    ]
  },
  {
    id: 'jingguang',
    name: { zh: '京广高铁', en: 'Beijing–Guangzhou HSR' },
    mileage: 'DK0+000 ~ DK2298+000',
    stations: [
      { x: 28, y: 90, label: { zh: '北京西', en: 'Beijing W.' }, terminal: true },
      { x: 145, y: 112, label: { zh: '石家庄', en: 'Shijiazhuang' } },
      { x: 270, y: 130, label: { zh: '郑州东', en: 'Zhengzhou E.' } },
      { x: 420, y: 160, label: { zh: '武汉', en: 'Wuhan' } },
      { x: 565, y: 185, label: { zh: '长沙南', en: 'Changsha S.' } },
      { x: 715, y: 205, label: { zh: '衡阳东', en: 'Hengyang E.' } },
      { x: 914, y: 225, label: { zh: '广州南', en: 'Guangzhou S.' }, terminal: true }
    ],
    alerts: [
      { x: 190, y: 92, label: 'DK421+600', tone: 'danger' },
      { x: 355, y: 128, label: 'DK862+400', tone: 'danger' },
      { x: 530, y: 157, label: 'DK1368+900', tone: 'warning' },
      { x: 760, y: 183, label: 'DK1886+200', tone: 'warning' }
    ]
  },
  {
    id: 'chengyu',
    name: { zh: '成渝高铁', en: 'Chengdu–Chongqing HSR' },
    mileage: 'DK0+000 ~ DK308+000',
    stations: [
      { x: 28, y: 175, label: { zh: '成都东', en: 'Chengdu E.' }, terminal: true },
      { x: 135, y: 155, label: { zh: '简阳南', en: 'Jianyang S.' } },
      { x: 250, y: 168, label: { zh: '资阳北', en: 'Ziyang N.' } },
      { x: 370, y: 140, label: { zh: '内江北', en: 'Neijiang N.' } },
      { x: 490, y: 155, label: { zh: '隆昌北', en: 'Longchang N.' } },
      { x: 610, y: 132, label: { zh: '荣昌北', en: 'Rongchang N.' } },
      { x: 730, y: 150, label: { zh: '永川东', en: 'Yongchuan E.' } },
      { x: 825, y: 130, label: { zh: '沙坪坝', en: 'Shapingba' } },
      { x: 914, y: 145, label: { zh: '重庆北', en: 'Chongqing N.' }, terminal: true }
    ],
    alerts: [
      { x: 185, y: 135, label: 'DK48+200', tone: 'warning' },
      { x: 410, y: 118, label: 'DK126+500', tone: 'danger' },
      { x: 650, y: 110, label: 'DK218+900', tone: 'danger' },
      { x: 845, y: 108, label: 'DK286+400', tone: 'warning' }
    ]
  }
];

const dashboardText = {
  zh: {
    brandTitle: '高铁线路病害查询系统', platform: '智能巡检分析平台', messageCenter: '消息中心', admin: '管理员',
    accountSettings: '账户设置', logout: '退出登录', collapse: '收起', more: '更多',
    latestAlarm: '最新告警', unreadMessages: '共 12 条未读消息',
    nav: { overview: '线路总览', realtime: '实时监测', query: '病害查询', analysis2d: '2D分析', analysis3d: '3D分析', analytics: '数据分析', devices: '设备监测', reports: '报表管理', system: '系统管理' },
    metrics: { onlineRate: '设备在线率', online: '在线', total: '总数', todayAlarms: '今日告警', severeDefects: '严重病害', pending: '待处理', processing: '处理中', health: '线路健康度', score: '分', excellent: '优', good: '良', moderate: '一般', poor: '差' },
    severe: '严重', moderate: '一般', minor: '轻微', mileageRange: '里程范围',
    realtimeAlarms: '实时告警', signalTrend: 'DAS 信号趋势', channel: '通道', timeRange: '时间范围', recentHour: '近1小时', frequency: '频率(Hz)', mileageAxis: '里程(DK)',
    defectDistribution: '病害分布', recent7Days: '近7天', defectTotal: '病害总数', detectionData: '检测数据',
    tableHeaders: ['告警ID', '里程(DK)', '线路', '病害类型', '严重程度', '告警时间', '状态'],
    left: '左线', right: '右线', railCorrugation: '钢轨波磨', fastenerLoose: '扣件松动', railVibration: '钢轨异常振动', sleeperAnomaly: '轨枕异常', minorFluctuation: '轻微波动',
    pending: '待处理', processing: '处理中', recorded: '已记录',
    systemStatus: '系统状态', normal: '正常', dataUpdated: '数据更新时间', currentLine: '当前线路',
    accountTitle: '账户设置', accountInfo: '账户信息', username: '用户名', role: '角色', administratorRole: '系统管理员', accountHint: '如需修改账户资料或密码，请联系系统管理员。', close: '关闭'
  },
  en: {
    brandTitle: 'High-Speed Rail Defect Query System', platform: 'Intelligent Inspection Platform', messageCenter: 'Messages', admin: 'Administrator',
    accountSettings: 'Account Settings', logout: 'Log Out', collapse: 'Collapse', more: 'More',
    latestAlarm: 'Latest Alarm', unreadMessages: '12 unread messages',
    nav: { overview: 'Line Overview', realtime: 'Live Monitoring', query: 'Defect Query', analysis2d: '2D Analysis', analysis3d: '3D Analysis', analytics: 'Data Analytics', devices: 'Devices', reports: 'Reports', system: 'System' },
    metrics: { onlineRate: 'Device Online Rate', online: 'Online', total: 'Total', todayAlarms: "Today's Alarms", severeDefects: 'Severe Defects', pending: 'Pending', processing: 'Processing', health: 'Line Health', score: 'pts', excellent: 'Excellent', good: 'Good', moderate: 'Fair', poor: 'Poor' },
    severe: 'Severe', moderate: 'Moderate', minor: 'Minor', mileageRange: 'Mileage',
    realtimeAlarms: 'Real-time Alarms', signalTrend: 'DAS Signal Trend', channel: 'Channel', timeRange: 'Time Range', recentHour: 'Last hour', frequency: 'Frequency (Hz)', mileageAxis: 'Mileage (DK)',
    defectDistribution: 'Defect Distribution', recent7Days: 'Last 7 days', defectTotal: 'Total defects', detectionData: 'Detection Data',
    tableHeaders: ['Alarm ID', 'Mileage (DK)', 'Track', 'Defect Type', 'Severity', 'Alarm Time', 'Status'],
    left: 'Left', right: 'Right', railCorrugation: 'Rail corrugation', fastenerLoose: 'Loose fastener', railVibration: 'Abnormal rail vibration', sleeperAnomaly: 'Sleeper anomaly', minorFluctuation: 'Minor fluctuation',
    pending: 'Pending', processing: 'Processing', recorded: 'Recorded',
    systemStatus: 'System', normal: 'Normal', dataUpdated: 'Last updated', currentLine: 'Current line',
    accountTitle: 'Account Settings', accountInfo: 'Account Information', username: 'Username', role: 'Role', administratorRole: 'System Administrator', accountHint: 'Contact the system administrator to update your profile or password.', close: 'Close'
  }
};

function SparkLine({ color = '#14e7e8', points = '0,25 10,24 20,11 30,28 42,10 53,17 65,6 77,13 90,8 108,19' }) {
  return (
    <svg className="dash-sparkline" viewBox="0 0 108 34" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function MetricCard({ icon, tone, label, value, suffix, children, graph }) {
  return (
    <section className={`dash-panel dash-metric dash-metric--${tone}`}>
      <div className="dash-metric-icon"><i className={`fa-solid ${icon}`} /></div>
      <div className="dash-metric-copy">
        <span>{label}</span>
        <strong>{value}<small>{suffix}</small></strong>
        <div className="dash-metric-detail">{children}</div>
      </div>
      <div className="dash-metric-graph">{graph}</div>
    </section>
  );
}

function Sidebar({ collapsed, setCollapsed, navigate, copy }) {
  return (
    <aside className={`dash-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <nav>
        {navigationItems.map((item, index) => (
          <button
            className={`dash-nav-item ${index === 0 ? 'active' : ''}`}
            key={item.label}
            type="button"
            title={copy.nav[item.label]}
            onClick={() => item.path && navigate(item.path)}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{copy.nav[item.label]}</span>
          </button>
        ))}
      </nav>
      <button className="dash-collapse" type="button" onClick={() => setCollapsed(!collapsed)}>
        <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
        <span>{copy.collapse}</span>
      </button>
    </aside>
  );
}

function RouteMap({ route, onRouteChange, isEnglish, copy }) {
  const [routeMenuOpen, setRouteMenuOpen] = useState(false);
  const routeMenuRef = useRef(null);
  const language = isEnglish ? 'en' : 'zh';
  const routeName = route.name[language];

  useEffect(() => {
    const closeRouteMenu = (event) => {
      if (routeMenuRef.current && !routeMenuRef.current.contains(event.target)) {
        setRouteMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeRouteMenu);
    return () => document.removeEventListener('pointerdown', closeRouteMenu);
  }, []);

  return (
    <section className="dash-panel dash-route-panel">
      <div className="dash-panel-heading dash-route-heading">
        <div className="dash-route-selector" ref={routeMenuRef}>
          <button
            type="button"
            className={`dash-route-name ${routeMenuOpen ? 'is-open' : ''}`}
            onClick={() => setRouteMenuOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={routeMenuOpen}
          >
            {routeName}<i className="fa-solid fa-caret-down" />
          </button>
          {routeMenuOpen ? (
            <div className="dash-route-dropdown" role="listbox" aria-label={isEnglish ? 'Select railway line' : '选择铁路线'}>
              {railwayRoutes.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={option.id === route.id ? 'active' : ''}
                  onClick={() => {
                    onRouteChange(option.id);
                    setRouteMenuOpen(false);
                  }}
                  role="option"
                  aria-selected={option.id === route.id}
                >
                  <span>{option.name[language]}</span>
                  {option.id === route.id ? <i className="fa-solid fa-check" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" className="dash-icon-button" title={isEnglish ? 'Fullscreen' : '全屏'}><i className="fa-solid fa-expand" /></button>
      </div>
      <div className="dash-map-grid" aria-hidden="true" />
      <svg className="dash-route-svg" viewBox="0 0 950 270" preserveAspectRatio="none" aria-label={routeName}>
        <defs>
          <filter id="routeGlow" x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="routeLine" x1="0" x2="1">
            <stop offset="0" stopColor="var(--dash-route-start)" />
            <stop offset=".5" stopColor="var(--dash-route-middle)" />
            <stop offset="1" stopColor="var(--dash-route-end)" />
          </linearGradient>
        </defs>
        <g className="dash-map-roads">
          <path d="M0 80 C120 50 210 90 330 35 S570 55 710 28 850 75 950 45" />
          <path d="M25 220 C140 160 235 200 315 158 S500 120 620 205 820 160 950 195" />
          <path d="M110 0 C135 70 96 120 155 270M330 0 C310 70 365 150 335 270M545 0 C530 65 590 130 560 270M760 0 C740 70 790 150 775 270" />
          <path d="M0 145 C110 125 180 155 260 102 S455 100 530 78 705 105 950 85" />
        </g>
        <polyline
          className="dash-route-glow"
          points={route.stations.map((station) => `${station.x},${station.y}`).join(' ')}
          fill="none"
          stroke="url(#routeLine)"
          strokeWidth="4"
          filter="url(#routeGlow)"
        />
        {route.stations.map((station, index) => (
          <g key={station.label.en}>
            <circle cx={station.x} cy={station.y} r={station.terminal ? 8 : 4.5} className={station.terminal ? 'route-terminal' : 'route-station'} />
            {station.terminal ? <circle cx={station.x} cy={station.y} r="2.5" className="route-terminal-dot" /> : null}
            <text
              x={station.x - (index === route.stations.length - 1 ? 7 : 0)}
              y={station.y + (index % 2 ? 25 : 29)}
              textAnchor={index === route.stations.length - 1 ? 'end' : 'middle'}
              className="route-label"
            >
              {station.label[language]}
            </text>
          </g>
        ))}
        {route.alerts.map((alert) => (
          <g key={`${alert.x}-${alert.y}`}>
            {alert.label ? <text x={alert.x} y={alert.y - 46} textAnchor="middle" className="route-alert-label">{alert.label}</text> : null}
            <line x1={alert.x} y1={alert.y - 28} x2={alert.x} y2={alert.y + 15} className={`route-alert-line ${alert.tone}`} />
            {alert.tone === 'danger' ? (
              <g>
                <circle cx={alert.x} cy={alert.y - 27} r="10" className="route-alert-danger" />
                <text x={alert.x} y={alert.y - 23} textAnchor="middle" className="route-alert-mark">!</text>
              </g>
            ) : (
              <path d={`M${alert.x} ${alert.y - 40} l10 18 h-20z`} className="route-alert-warning" />
            )}
          </g>
        ))}
      </svg>
      <div className="dash-route-legend">
        <div><span className="legend-dot danger" />{copy.severe} <b>6</b><span className="legend-triangle" />{copy.moderate} <b>11</b><span className="legend-ring" />{copy.minor} <b>12</b></div>
        <p>{copy.mileageRange}：{route.mileage}</p>
      </div>
      <div className="dash-map-controls">
        <button type="button">+</button><button type="button">−</button><button type="button"><i className="fa-solid fa-location-crosshairs" /></button>
      </div>
    </section>
  );
}

function AlarmList({ navigate, copy }) {
  return (
    <section className="dash-panel dash-alarm-panel">
      <div className="dash-panel-heading">
        <h3>{copy.realtimeAlarms}</h3>
        <button type="button" className="dash-more" onClick={() => navigate('/query')}>{copy.more} <i className="fa-solid fa-angle-right" /></button>
      </div>
      <div className="dash-alarm-list">
        {alarmItems.map((alarm) => (
          <button className="dash-alarm-row" type="button" key={`${alarm.km}-${alarm.time}`} onClick={() => navigate('/query')}>
            <span className={`dash-alarm-symbol ${alarm.tone}`}>{alarm.tone === 'danger' ? '!' : alarm.tone === 'warning' ? '▲' : '!'}</span>
            <span className="dash-alarm-copy"><strong>{alarm.km} {copy[alarm.line]}</strong><small>{copy[alarm.type]}</small></span>
            <time>{alarm.time}</time>
            <span className={`dash-level ${alarm.tone}`}>{copy[alarm.level]}</span>
            <i className="fa-solid fa-angle-right" />
          </button>
        ))}
      </div>
    </section>
  );
}

function SignalTrend({ copy }) {
  const bars = useMemo(() => [34, 52, 82, 64, 92, 48, 59, 73, 44, 89, 70, 56, 93, 68, 45, 72, 62, 86, 51, 77, 66, 84, 57, 91], []);
  return (
    <section className="dash-panel dash-bottom-panel dash-signal-panel">
      <div className="dash-panel-heading">
        <h3>{copy.signalTrend}</h3>
        <div className="dash-filter-group"><span>{copy.channel}<br /><b>CH-05 ({copy.left})</b></span><span>{copy.mileageRange}<br /><b>DK500+000 ~ DK510+000</b></span><span>{copy.timeRange}<br /><b>{copy.recentHour}</b></span></div>
        <button type="button" className="dash-icon-button"><i className="fa-solid fa-expand" /></button>
      </div>
      <div className="dash-heatmap-layout">
        <div className="dash-y-label">{copy.frequency}</div>
        <div className="dash-y-axis"><span>1000</span><span>800</span><span>600</span><span>400</span><span>200</span><span>0</span></div>
        <div className="dash-heatmap">
          <div className="dash-heatmap-noise" />
          {bars.map((height, index) => <span key={index} style={{ height: `${height}%`, left: `${index * 4.15}%`, opacity: .25 + (height / 160) }} />)}
        </div>
        <div className="dash-spectrum"><i /><span>0</span><span>-30</span><span>-60</span><span>-90</span><span>-120</span></div>
      </div>
      <div className="dash-x-axis"><span>500+000</span><span>502+000</span><span>504+000</span><span>506+000</span><span>508+000</span><span>510+000</span></div>
      <div className="dash-axis-caption">{copy.mileageAxis}</div>
    </section>
  );
}

function DistributionChart({ copy }) {
  const series = [
    { x: 42, red: 42, orange: 56, blue: 28, line: 65 },
    { x: 88, red: 25, orange: 54, blue: 31, line: 53 },
    { x: 134, red: 39, orange: 71, blue: 33, line: 78 },
    { x: 180, red: 82, orange: 112, blue: 58, line: 136 },
    { x: 226, red: 34, orange: 65, blue: 27, line: 101 },
    { x: 272, red: 42, orange: 53, blue: 25, line: 83 },
    { x: 318, red: 57, orange: 67, blue: 31, line: 55 }
  ];
  return (
    <section className="dash-panel dash-bottom-panel dash-distribution-panel">
      <div className="dash-panel-heading"><h3>{copy.defectDistribution}</h3><button type="button" className="dash-select">{copy.recent7Days} <i className="fa-solid fa-caret-down" /></button></div>
      <div className="dash-chart-legend"><span className="red" />{copy.severe} <span className="orange" />{copy.moderate} <span className="blue" />{copy.minor} <i />{copy.defectTotal}</div>
      <svg className="dash-distribution-chart" viewBox="0 0 360 205" preserveAspectRatio="none">
        {[20, 60, 100, 140, 180].map((y) => <line key={y} x1="30" x2="344" y1={y} y2={y} className="chart-grid" />)}
        <line x1="30" x2="30" y1="10" y2="180" className="chart-axis" /><line x1="30" x2="344" y1="180" y2="180" className="chart-axis" />
        {series.map((item, index) => (
          <g key={index}>
            <rect x={item.x - 12} y={180 - item.red} width="7" height={item.red} className="bar-red" />
            <rect x={item.x - 3} y={180 - item.orange} width="7" height={item.orange} className="bar-orange" />
            <rect x={item.x + 6} y={180 - item.blue} width="7" height={item.blue} className="bar-blue" />
          </g>
        ))}
        <polyline points={series.map((item) => `${item.x},${180 - item.line}`).join(' ')} className="chart-line" />
        {series.map((item, index) => <circle key={index} cx={item.x} cy={180 - item.line} r="3" className="chart-dot" />)}
        {['05-12', '05-13', '05-14', '05-15', '05-16', '05-17', '05-18'].map((label, index) => <text key={label} x={series[index].x} y="199" textAnchor="middle">{label}</text>)}
      </svg>
    </section>
  );
}

function DetectionTable({ navigate, copy }) {
  return (
    <section className="dash-panel dash-bottom-panel dash-table-panel">
      <div className="dash-panel-heading"><h3>{copy.detectionData}</h3><button type="button" className="dash-more" onClick={() => navigate('/query')}>{copy.more} <i className="fa-solid fa-angle-right" /></button></div>
      <div className="dash-table-wrap">
        <table>
          <thead><tr>{copy.tableHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
          <tbody>{detectionRows.map((row) => (
            <tr key={row[0]} onClick={() => navigate('/query')}>
              {row.map((cell, index) => {
                const localized = [2, 3, 4, 6].includes(index) ? copy[cell] : cell;
                return <td key={index} className={index === 4 ? `severity-${cell}` : index === 6 ? `status-${cell}` : ''}>{index === 6 ? <span>{localized}</span> : localized}</td>;
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith('en');
  const copy = dashboardText[isEnglish ? 'en' : 'zh'];
  const [collapsed, setCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(railwayRoutes[0].id);
  const [clock, setClock] = useState(new Date());
  const userMenuRef = useRef(null);
  const selectedRoute = railwayRoutes.find((route) => route.id === selectedRouteId) || railwayRoutes[0];

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeUserMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeUserMenu);
    return () => document.removeEventListener('pointerdown', closeUserMenu);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className={`dash-app ${isEnglish ? 'is-english' : ''}`}>
      <header className="dash-header">
        <div className="dash-brand">
          <span className="dash-brand-mark"><img src="/dashboard-train.png" alt="" /></span>
          <h1>{copy.brandTitle}</h1>
          <span className="dash-brand-divider" />
          <p>{copy.platform}</p>
        </div>
        <div className="dash-header-actions">
          <LanguageToggle className="dash-language-toggle" />
          <ThemeToggle className="dash-theme-toggle" />
          <span className="dash-header-divider" />
          <div className="dash-notification-wrap">
            <button type="button" className="dash-header-button" onClick={() => setNotificationOpen((value) => !value)}>
              <span className="dash-bell"><i className="fa-regular fa-bell" /><b>12</b></span>{copy.messageCenter}
            </button>
            {notificationOpen ? <div className="dash-notification-popover"><strong>{copy.latestAlarm}</strong><p>DK512+300 {copy.left} · {copy.railCorrugation}</p><small>{copy.unreadMessages}</small></div> : null}
          </div>
          <span className="dash-header-divider" />
          <div className="dash-user-menu-wrap" ref={userMenuRef}>
            <button type="button" className={`dash-header-button dash-user ${userMenuOpen ? 'is-open' : ''}`} onClick={() => setUserMenuOpen((value) => !value)} aria-expanded={userMenuOpen}>
              <span><i className="fa-solid fa-user-tie" /></span>{copy.admin} <i className="fa-solid fa-angle-down dash-user-chevron" />
            </button>
            {userMenuOpen ? (
              <div className="dash-user-dropdown">
                <button type="button" onClick={() => { setAccountSettingsOpen(true); setUserMenuOpen(false); }}><i className="fa-regular fa-user" />{copy.accountSettings}</button>
                <button type="button" className="logout" onClick={handleLogout}><i className="fa-solid fa-arrow-right-from-bracket" />{copy.logout}</button>
              </div>
            ) : null}
          </div>
          <span className="dash-header-divider" />
          <button type="button" className="dash-fullscreen" onClick={toggleFullscreen} title={isEnglish ? 'Fullscreen' : '全屏'}><i className="fa-solid fa-expand" /></button>
        </div>
      </header>

      <div className="dash-shell">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} navigate={navigate} copy={copy} />
        <main className="dash-main">
          <div className="dash-metrics-grid">
            <MetricCard icon="fa-tower-broadcast" tone="cyan" label={copy.metrics.onlineRate} value="98.6" suffix="%" graph={<SparkLine />}>
              <span>{copy.metrics.online} <b>1,268</b></span><span>{copy.metrics.total} <b>1,286</b></span>
            </MetricCard>
            <MetricCard icon="fa-bell" tone="blue" label={copy.metrics.todayAlarms} value="23" graph={<div className="dash-mini-bars">{[22, 45, 72, 92, 63, 42, 25].map((value, i) => <i key={i} style={{ height: `${value}%` }} />)}</div>}>
              <span>{copy.severe} <b>6</b></span><span>{copy.moderate} <b>11</b></span><span>{copy.minor} <b>6</b></span>
            </MetricCard>
            <MetricCard icon="fa-shield-halved" tone="red" label={copy.metrics.severeDefects} value="6" graph={<SparkLine color="#ff303d" points="0,27 11,20 20,24 29,12 38,23 53,10 68,27 84,6 96,9 108,20" />}>
              <span>{copy.metrics.pending} <b>4</b></span><span>{copy.metrics.processing} <b>2</b></span>
            </MetricCard>
            <MetricCard icon="fa-heart-pulse" tone="teal" label={copy.metrics.health} value="92.4" suffix={copy.metrics.score} graph={<div className="dash-health-bar"><i /></div>}>
              <span>{copy.metrics.excellent} <b>78.5%</b></span><span>{copy.metrics.good} <b>16.2%</b></span><span>{copy.metrics.moderate} <b>4.1%</b></span><span>{copy.metrics.poor} <b>1.2%</b></span>
            </MetricCard>
          </div>

          <div className="dash-center-grid">
            <RouteMap route={selectedRoute} onRouteChange={setSelectedRouteId} isEnglish={isEnglish} copy={copy} />
            <AlarmList navigate={navigate} copy={copy} />
          </div>

          <div className="dash-bottom-grid">
            <SignalTrend copy={copy} />
            <DistributionChart copy={copy} />
            <DetectionTable navigate={navigate} copy={copy} />
          </div>
        </main>
      </div>

      <footer className="dash-footer">
        <span><i className="dash-status-dot" />{copy.systemStatus}：<b>{copy.normal}</b></span>
        <span>{copy.dataUpdated}：{clock.toLocaleDateString('zh-CN').replaceAll('/', '-')} {clock.toLocaleTimeString('zh-CN', { hour12: false })}</span>
        <span>{copy.currentLine}：{selectedRoute.name[isEnglish ? 'en' : 'zh']}（{selectedRoute.mileage}）</span>
      </footer>

      {accountSettingsOpen ? (
        <div className="dash-account-mask" onClick={(event) => event.target === event.currentTarget && setAccountSettingsOpen(false)}>
          <section className="dash-account-dialog" role="dialog" aria-modal="true" aria-label={copy.accountTitle}>
            <header><div><i className="fa-solid fa-user-gear" /><span><strong>{copy.accountTitle}</strong><small>{copy.accountInfo}</small></span></div><button type="button" onClick={() => setAccountSettingsOpen(false)}><i className="fa-solid fa-xmark" /></button></header>
            <div className="dash-account-body">
              <div className="dash-account-avatar"><i className="fa-solid fa-user-tie" /></div>
              <dl><div><dt>{copy.username}</dt><dd>admin</dd></div><div><dt>{copy.role}</dt><dd>{copy.administratorRole}</dd></div></dl>
              <p><i className="fa-solid fa-circle-info" />{copy.accountHint}</p>
            </div>
            <footer><button type="button" onClick={() => setAccountSettingsOpen(false)}>{copy.close}</button></footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
