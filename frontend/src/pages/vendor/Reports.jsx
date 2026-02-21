import { useState, useEffect } from 'react'
import { salonService, vendorService } from '../../services'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar
} from 'recharts'
import './Reports.css'

const REPORT_TABS = [
  { id: 'ratings', label: 'Ratings & Feedback' },
  { id: 'customers', label: 'Frequent Customers' },
  { id: 'earnings', label: 'Earnings Summary' },
]

function Reports() {
  const [activeTab, setActiveTab] = useState('ratings')
  const [salons, setSalons] = useState([])
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [reportsData, setReportsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSalons()
  }, [])

  useEffect(() => {
    if (selectedSalon) {
      fetchReports()
    }
  }, [selectedSalon])

  const fetchSalons = async () => {
    try {
      const data = await salonService.getMySalons()
      setSalons(data)
      if (data.length > 0) {
        setSelectedSalon(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching salons:', err)
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await vendorService.getReports(selectedSalon)
      setReportsData(data)
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderRatings = () => {
    if (!reportsData?.reviews) return null
    const { average_rating, total_count, recent_list, distribution } = reportsData.reviews

    const pieData = distribution.map(d => ({
      name: `${d.rating} Stars`,
      value: d.count
    }))

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

    return (
      <div className="report-section modern-layout">
        <div className="insights-brief card minimal">
          <p><strong>Pro Insight:</strong> {average_rating >= 4.5 ? "Your customers love your service! Keep maintainining the high standards to stay on top." : "Consider responding to your lower ratings to show customers you care about their feedback."}</p>
        </div>

        <div className="stats-header-grid">
          <div className="stat-card minimal">
            <span className="stat-label">Customer Satisfaction</span>
            <div className="stat-main">
              <span className="stat-value small-main">{Number(average_rating).toFixed(1)}</span>
              <span className="stat-max">/ 5.0</span>
            </div>
            <div className="rating-stars-preview">
              {'★'.repeat(Math.round(average_rating))}{'☆'.repeat(5 - Math.round(average_rating))}
            </div>
          </div>
          <div className="stat-card minimal">
            <span className="stat-label">Total Voice Count</span>
            <div className="stat-main">
              <span className="stat-value small-main">{total_count}</span>
            </div>
            <p className="stat-sub">Authentic feedback from your clients</p>
          </div>
        </div>

        <div className="visuals-container side-by-side">
          {/* Charts will naturally align side-by-side here */}
          <div className="chart-card glass-chart">
            <div className="chart-header">
              <h3>Satisfaction Mix</h3>
              <p>Proportional breakdown of all ratings</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    cornerRadius={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass-chart">
            <div className="chart-header">
              <h3>Rating Frequency</h3>
              <p>Frequency density across levels</p>
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={pieData}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={75} fontSize={11} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={12}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <h3>Recent Feedback</h3>
        <div className="reviews-compact-grid">
          {recent_list.length > 0 ? (
            recent_list.map(review => (
              <div key={review.id} className="review-mini-card">
                <div className="review-mini-header">
                  <span className="user-name-small">{review.user_name}</span>
                  <div className="rating-badge-mini">{review.rating} ★</div>
                </div>
                <p className="review-comment-mini">"{review.comment || "No comment left."}"</p>
                <span className="review-date-mini">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p className="hint">No reviews yet for this salon.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderCustomers = () => {
    if (!reportsData?.customers) return null
    return (
      <div className="report-section modern-layout">
        <div className="insights-brief card minimal">
          <p><strong>Customer Insight:</strong> You have a growing community of <strong>{reportsData.customers.length}</strong> core customers. Focus on the top loyalists below to drive referral growth.</p>
        </div>

        <div className="stats-header-grid">
          <div className="stat-card minimal">
            <span className="stat-label">Total Customers</span>
            <div className="stat-main">
              <span className="stat-value small-main">{reportsData.customers.length}</span>
            </div>
            <p className="stat-sub">Unique clients who have booked with you</p>
          </div>
          <div className="stat-card minimal">
            <span className="stat-label">Loyalty Segments</span>
            <div className="stat-main">
              <span className="stat-value small-main">Top 10</span>
            </div>
            <p className="stat-sub">Identifying your most frequent visitors</p>
          </div>
        </div>

        <h3>Top Loyal Customers</h3>
        <div className="entity-list loose">
          {reportsData.customers.length > 0 ? reportsData.customers.map((c, i) => (
            <div key={i} className="entity-card card loose-card slim">
              <div className="entity-main">
                <strong className="entity-title">{c.user__first_name ? `${c.user__first_name} ${c.user__last_name}` : (c.guest_name || c.user__username)}</strong>
                <div className="entity-sub-metrics">
                  <span>{c.visit_count} visits</span>
                  <span className="dot-sep">•</span>
                  <span>Spent ₹{Number(c.total_spent).toLocaleString()}</span>
                  {c.guest_mobile && (
                    <>
                      <span className="dot-sep">•</span>
                      <span>{c.guest_mobile}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <p className="hint">No customer data yet.</p>
          )}
        </div>
      </div>
    )
  }

  const renderEarnings = () => {
    if (!reportsData?.earnings) return null
    const { total_revenue, daily_stats } = reportsData.earnings

    const chartData = daily_stats.map(d => ({
      date: new Date(d.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      revenue: Number(d.revenue),
      volume: d.appointments_count
    }))

    return (
      <div className="report-section modern-layout">
        <div className="insights-brief card minimal">
          <p><strong>Business Insight:</strong> Your average daily revenue is <strong>₹{Math.round(daily_stats.reduce((sum, d) => sum + Number(d.revenue), 0) / (daily_stats.length || 1)).toLocaleString()}</strong>. Your most profitable day recently was <strong>{chartData.sort((a, b) => b.revenue - a.revenue)[0]?.date}</strong>.</p>
        </div>

        <div className="stats-header-grid">
          <div className="stat-card minimal">
            <span className="stat-label">Life-time Revenue</span>
            <div className="stat-main">
              <span className="stat-currency">₹</span>
              <span className="stat-value small-main">{total_revenue?.toLocaleString()}</span>
            </div>
            <p className="stat-sub">Gross income since opening</p>
          </div>
          <div className="stat-card minimal">
            <span className="stat-label">Last 30 Days</span>
            <div className="stat-main">
              <span className="stat-currency">₹</span>
              <span className="stat-value small-main">
                {daily_stats.reduce((sum, d) => sum + Number(d.revenue), 0).toLocaleString()}
              </span>
            </div>
            <p className="stat-sub">Revenue stream this month</p>
          </div>
        </div>

        <div className="visuals-container side-by-side">
          <div className="chart-card glass-chart">
            <div className="chart-header">
              <h3>Revenue Pulse</h3>
              <p>Daily cash flow visualization</p>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={9} minTickGap={40} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                    formatter={(v) => [`₹${v}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card glass-chart">
            <div className="chart-header">
              <h3>Booking Intensity</h3>
              <p>Daily appointment volume variation</p>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--color-accent)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <h3>Daily Revenue (Last 30 Days)</h3>
        <div className="entity-list loose">
          {daily_stats.length > 0 ? [...daily_stats].reverse().map((day, i) => (
            <div key={i} className="entity-card card loose-card slim">
              <div className="entity-main">
                <strong className="entity-title">{new Date(day.appointment_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>
                <div className="entity-sub-metrics">
                  <span>{day.appointments_count} appointments</span>
                  <span className="dot-sep">•</span>
                  <span>Revenue: ₹{Number(day.revenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )) : (
            <p className="hint">No transactions found in the last 30 days.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="header-with-selector">
        <div className="page-header">
          <h1>Analytics & Reports</h1>
          <p>Insights into your salon's growth and customer satisfaction.</p>
        </div>

        {salons.length > 0 && (
          <div className="salon-selector-inline">
            <label>Active Salon</label>
            <select
              value={selectedSalon || ''}
              onChange={(e) => setSelectedSalon(e.target.value)}
            >
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="profile-tabs">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        {loading ? (
          <div className="loading-state">Analyzing data...</div>
        ) : (
          <>
            {activeTab === 'ratings' && renderRatings()}
            {activeTab === 'customers' && renderCustomers()}
            {activeTab === 'earnings' && renderEarnings()}
          </>
        )}
      </div>
    </div>
  )
}

export default Reports
