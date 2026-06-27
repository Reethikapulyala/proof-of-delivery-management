import React, { useEffect, useRef } from 'react';
import { 
  BarChart3, LineChart, PieChart, TrendingUp, Award, Clock, IndianRupee, Users, Truck
} from 'lucide-react';

export default function Reports({ deliveries = [] }) {
  // References for Chart.js canvases
  const monthlyRevenueRef = useRef(null);
  const shipmentTrendsRef = useRef(null);
  const fleetUsageRef = useRef(null);
  const customerGrowthRef = useRef(null);
  const collectionsRef = useRef(null);

  // 1. Calculate KPI Metrics
  const totalShipments = deliveries.length;
  const delivered = deliveries.filter(d => d.status === 'Delivered').length;
  const failed = deliveries.filter(d => d.status === 'Failed').length;
  
  // Shipment Success Rate
  const successRate = totalShipments > 0 ? Math.round((delivered / (delivered + failed || 1)) * 100) : 92;
  
  // Custom baseline KPIs for logistics analytics
  const revenue = 28500.00;
  const deliveryPerformance = 95.8; // On-time SLA%
  const fleetUtilization = 85.0; // Utilization%
  const driverProductivity = 4.2; // average deliveries/day
  const customerGrowth = 15; // MoM percentage growth

  useEffect(() => {
    if (!window.Chart) {
      console.warn('Chart.js is not loaded.');
      return;
    }

    const Chart = window.Chart;
    let chart1, chart2, chart3, chart4, chart5;

    // --- CHART 1: Monthly Revenue (Bar Chart) ---
    if (monthlyRevenueRef.current) {
      chart1 = new Chart(monthlyRevenueRef.current, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue (₹)',
            data: [15000, 18200, 16900, 21000, 24500, revenue],
            backgroundColor: 'rgba(2, 132, 199, 0.85)',
            hoverBackgroundColor: '#0284c7',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)', font: { size: 10 } } }
          }
        }
      });
    }

    // --- CHART 2: Shipment Trends (Line Chart) ---
    if (shipmentTrendsRef.current) {
      const ctx = shipmentTrendsRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

      chart2 = new Chart(shipmentTrendsRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Shipment Volume',
            data: [95, 115, 102, 130, 145, 120 + totalShipments],
            borderColor: '#10b981',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#10b981',
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)', font: { size: 10 } } }
          }
        }
      });
    }

    // --- CHART 3: Fleet Usage Status (Doughnut) ---
    if (fleetUsageRef.current) {
      chart3 = new Chart(fleetUsageRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Idle', 'Maintenance'],
          datasets: [{
            data: [fleetUtilization, 100 - fleetUtilization - 5, 5],
            backgroundColor: ['#10b981', '#eab308', '#ef4444'],
            borderColor: 'var(--bg-secondary)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: 'var(--text-secondary)', font: { size: 11 } }
            }
          },
          cutout: '70%'
        }
      });
    }

    // --- CHART 4: Customer Growth (Line Chart) ---
    if (customerGrowthRef.current) {
      chart4 = new Chart(customerGrowthRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Corporate Accounts',
            data: [42, 45, 48, 52, 58, 65],
            borderColor: '#a855f7',
            borderWidth: 3,
            tension: 0.2,
            fill: false,
            pointBackgroundColor: '#a855f7'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)', font: { size: 10 } } }
          }
        }
      });
    }

    // --- CHART 5: Invoice Collections Status (Horizontal Bar) ---
    if (collectionsRef.current) {
      chart5 = new Chart(collectionsRef.current, {
        type: 'bar',
        data: {
          labels: ['Paid', 'Pending', 'Overdue'],
          datasets: [{
            label: 'Collections (₹)',
            data: [18500, 6200, 3800],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            borderRadius: 6,
            barThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-tertiary)', font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { color: 'var(--text-secondary)', font: { size: 11 } } }
          }
        }
      });
    }

    return () => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
      if (chart3) chart3.destroy();
      if (chart4) chart4.destroy();
      if (chart5) chart5.destroy();
    };
  }, [deliveries, totalShipments, successRate]);

  return (
    <div className="view-container reports-view-page">
      <style>{`
        .reports-view-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeIn 0.4s ease-out;
        }
        .stats-grid-analytics {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1200px) {
          .stats-grid-analytics {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .stats-grid-analytics {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .stats-grid-analytics {
            grid-template-columns: 1fr;
          }
        }
        .charts-dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 992px) {
          .charts-dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        .chart-box-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 320px;
        }
        .chart-box-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }
        .chart-canvas-container {
          position: relative;
          flex: 1;
          width: 100%;
          min-height: 200px;
        }
      `}</style>

      {/* Header section */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Executive Business Analytics</h1>
          <p className="view-header-subtitle">
            Fleet KPIs, shipment volumes, revenue charts, and financial collections ledgers.
          </p>
        </div>
      </div>

      {/* 6 Analytics KPI Cards */}
      <div className="stats-grid-analytics">
        
        {/* Card 1: Revenue */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-header">
            <span className="stat-title">Revenue</span>
            <IndianRupee size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">₹{revenue.toLocaleString()}</div>
          <div className="stat-footer">
            <span>Current Month Collections</span>
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-header">
            <span className="stat-title">Success Rate</span>
            <Award size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">{successRate}%</div>
          <div className="stat-footer">
            <span>Completed vs exceptions</span>
          </div>
        </div>

        {/* Card 3: Delivery Performance */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-header">
            <span className="stat-title">On-Time SLA</span>
            <Clock size={18} style={{ color: 'var(--info)' }} />
          </div>
          <div className="stat-value">{deliveryPerformance}%</div>
          <div className="stat-footer">
            <span>SLA schedule adherence</span>
          </div>
        </div>

        {/* Card 4: Fleet Utilization */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-header">
            <span className="stat-title">Fleet Usage</span>
            <Truck size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">{fleetUtilization}%</div>
          <div className="stat-footer">
            <span>Active deployed vehicles</span>
          </div>
        </div>

        {/* Card 5: Driver Productivity */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-header">
            <span className="stat-title">Driver Efficiency</span>
            <Users size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">{driverProductivity}</div>
          <div className="stat-footer">
            <span>Avg drops per day</span>
          </div>
        </div>

        {/* Card 6: Customer Growth */}
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-header">
            <span className="stat-title">Client Growth</span>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">+{customerGrowth}%</div>
          <div className="stat-footer">
            <span>MoM customer growth</span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-dashboard-grid">
        
        {/* Chart 1: Monthly Revenue */}
        <div className="chart-box-card">
          <h4 className="chart-box-title">
            <IndianRupee size={18} style={{ color: 'var(--primary)' }} />
            <span>Monthly Revenue Progress</span>
          </h4>
          <div className="chart-canvas-container">
            <canvas ref={monthlyRevenueRef} />
          </div>
        </div>

        {/* Chart 2: Shipment Trends */}
        <div className="chart-box-card">
          <h4 className="chart-box-title">
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
            <span>Shipment Booking Trends</span>
          </h4>
          <div className="chart-canvas-container">
            <canvas ref={shipmentTrendsRef} />
          </div>
        </div>

        {/* Chart 3: Fleet Usage */}
        <div className="chart-box-card">
          <h4 className="chart-box-title">
            <Truck size={18} style={{ color: 'var(--warning)' }} />
            <span>Fleet Status Distribution</span>
          </h4>
          <div className="chart-canvas-container">
            <canvas ref={fleetUsageRef} />
          </div>
        </div>

        {/* Chart 4: Customer Growth */}
        <div className="chart-box-card">
          <h4 className="chart-box-title">
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <span>Customer Accounts Growth</span>
          </h4>
          <div className="chart-canvas-container">
            <canvas ref={customerGrowthRef} />
          </div>
        </div>

        {/* Chart 5: Invoice Collections */}
        <div className="chart-box-card" style={{ gridColumn: 'span 2' }}>
          <h4 className="chart-box-title">
            <BarChart3 size={18} style={{ color: 'var(--info)' }} />
            <span>Invoicing Collections Status</span>
          </h4>
          <div className="chart-canvas-container">
            <canvas ref={collectionsRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
