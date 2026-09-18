import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Compass } from 'lucide-react';

import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/common/StatCard';
import BarChartCard from '../../components/common/BarChartCard';
import PieChartCard from '../../components/common/PieChartCard';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

import {
  getAnalytics,
  getGovernmentChallenges,
  validateChallenge,
} from '../../services/governmentService';

import { getCategories } from '../../services/categoryService';
import { DOMAINS } from '../../utils/constants';
import { getStatusLabel } from '../../utils/statusUtils';

const navItems = [
  {
    to: '/government/dashboard',
    label: 'nav.dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/challenges',
    label: 'nav.exploreChallenges',
    icon: Compass,
  },
];

const initialFilters = {
  district: '',
  domain: '',
  status: '',
  dateFrom: '',
};

export default function GovernmentDashboard() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilters);
  const [analytics, setAnalytics] = useState(null);
  const [pendingValidation, setPendingValidation] = useState([]);
  const [categories, setCategories] = useState(DOMAINS);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);

  const load = async (currentFilters = filters) => {
    setLoading(true);

    try {
      const params = {};

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '') {
          params[key] = value;
        }
      });

      const [analyticsRes, challengesRes] = await Promise.all([
        getAnalytics(params),
        getGovernmentChallenges({
          ...params,
          status: 'ai_analysis',
        }),
      ]);

      setAnalytics(analyticsRes.data);
      setPendingValidation(challengesRes.data.challenges);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    getCategories()
      .then((res) => {
        if (res.data.categories.length > 0) {
          setCategories(
            res.data.categories.map((c) => c.name)
          );
        }
      })
      .catch(() => {});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    load(filters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    load(initialFilters);
  };

  const handleValidate = async (id) => {
    setValidatingId(id);

    try {
      await validateChallenge(id);
      await load();
    } catch (error) {
      console.log('Validation error:', error);
      console.log('Status:', error.response?.status);
      console.log('Backend message:', error.response?.data);
    } finally {
      setValidatingId(null);
    }
  };

  const handleChallengeClick = (id) => {
    navigate(`/challenges/${id}`);
  };

  if (loading || !analytics) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="p-8 text-inkMuted">
          Loading analytics...
        </div>
      </DashboardLayout>
    );
  }

  const { stats, charts } = analytics;

  const statusChartData = charts.challengeStatus.map((s) => ({
    ...s,
    label: getStatusLabel(s.label),
  }));

  return (
    <DashboardLayout navItems={navItems}>
      <div className="p-8 max-w-7xl">

        <h1 className="font-display text-2xl font-semibold text-ink50 mb-1">
          Government Analytics
        </h1>

        <p className="text-sm text-inkMuted mb-8">
          Platform-wide visibility across every challenge, project, and partner.
        </p>

        {/* FILTERS */}
        <form
          onSubmit={applyFilters}
          className="bg-panel border border-panelLight rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Input
            label="District"
            name="district"
            value={filters.district}
            onChange={handleFilterChange}
            placeholder="Any district"
          />

          <Select
            label="Domain"
            name="domain"
            value={filters.domain}
            onChange={handleFilterChange}
          >
            <option value="">All domains</option>

            {categories.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Any status</option>
            <option value="submitted">Submitted</option>
            <option value="ai_analysis">AI Analysis</option>
            <option value="validated">Validated</option>
            <option value="university_assigned">
              University Assigned
            </option>
            <option value="deployed">Deployed</option>
          </Select>

          <Input
            label="From date"
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />

          <div className="md:col-span-4 flex gap-3">
            <Button type="submit" variant="primary">
              Apply filters
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
            >
              Clear
            </Button>
          </div>
        </form>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

          <StatCard
            label="Total challenges"
            value={stats.totalChallenges}
          />

          <StatCard
            label="Validated"
            value={stats.validatedChallenges}
            accent="text-pulse"
          />

          <StatCard
            label="Active projects"
            value={stats.activeProjects}
            accent="text-signal"
          />

          <StatCard
            label="Completed projects"
            value={stats.completedProjects}
            accent="text-green-400"
          />

          <StatCard
            label="Deployed solutions"
            value={stats.deployedSolutions}
            accent="text-green-400"
          />

          <StatCard
            label="Universities involved"
            value={stats.universitiesInvolved}
          />

          <StatCard
            label="Industry partners"
            value={stats.industryPartners}
          />

          <StatCard
            label="Citizens benefited"
            value={stats.citizensBenefited}
            accent="text-pulse"
          />

        </div>

        {/* AWAITING VALIDATION */}
        {pendingValidation.length > 0 && (
          <div className="mb-10">

            <h2 className="font-display text-lg font-semibold text-ink50 mb-4 flex items-center gap-2">
              <ShieldCheck
                size={18}
                className="text-signal"
              />

              Awaiting validation
            </h2>

            <div className="flex flex-col gap-3">

              {pendingValidation.map((c) => (

                <div
                  key={c._id}
                  onClick={() => handleChallengeClick(c._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' ||
                      e.key === ' '
                    ) {
                      handleChallengeClick(c._id);
                    }
                  }}
                  className="bg-panel border border-panelLight rounded-lg px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:border-signal hover:bg-panelLight transition-colors"
                >

                  {/* CHALLENGE INFO */}
                  <div className="min-w-0">

                    <span className="text-sm text-ink50 truncate block">
                      {c.title}
                    </span>

                    <span className="text-xs text-inkMuted">
                      {c.district} · {c.domain}
                    </span>

                  </div>

                  {/* ACTIONS */}
                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >

                    <StatusBadge status={c.status} />

                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidate(c._id);
                      }}
                      className={
                        validatingId === c._id
                          ? 'opacity-50 pointer-events-none'
                          : ''
                      }
                    >
                      {validatingId === c._id
                        ? 'Validating...'
                        : 'Validate'}
                    </Button>

                  </div>

                </div>

              ))}

            </div>
          </div>
        )}

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <BarChartCard
            title="Challenges by district"
            data={charts.challengesByDistrict}
          />

          <BarChartCard
            title="Challenges by domain"
            data={charts.challengesByDomain}
            color="#2DD4BF"
          />

          <PieChartCard
            title="Challenge status breakdown"
            data={statusChartData}
          />

          <BarChartCard
            title="University participation"
            data={charts.universityParticipation}
            color="#2DD4BF"
          />

          <BarChartCard
            title="Industry participation"
            data={charts.industryParticipation}
          />

          <PieChartCard
            title="Project completion"
            data={charts.projectCompletion}
          />

          <div className="md:col-span-2">

            <BarChartCard
              title="Social impact — people impacted by domain"
              data={charts.socialImpactByDomain}
              color="#2DD4BF"
              valueLabel="People impacted"
            />

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}