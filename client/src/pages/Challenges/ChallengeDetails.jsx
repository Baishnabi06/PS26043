import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  MapPin,
  Users,
  FileText,
  Sparkles,
  RefreshCw,
  UserRound,
  Image as ImageIcon,
} from 'lucide-react';

import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import { getChallengeById, triggerAnalysis, getSimilarChallenges } from '../../services/challengeService';
import { createProject } from '../../services/projectService';
import { refreshRecommendations } from '../../services/universityService';
import { useSelector } from 'react-redux';

export default function ChallengeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [creatingProject, setCreatingProject] = useState(false);
    const [refreshingRecs, setRefreshingRecs] = useState(false);
    const [similarChallenges, setSimilarChallenges] = useState([]);

    useEffect(() => {
        getChallengeById(id)
            .then((res) => setChallenge(res.data.challenge))
            .catch((err) => setError(err.response?.data?.message || 'Could not load this challenge.'))
            .finally(() => setLoading(false));

        // Computed live rather than trusting challenge.similarChallenges, which
        // is only a stale snapshot from whenever THIS challenge's own analysis
        // last ran — it never reflects challenges submitted afterward.
        getSimilarChallenges(id)
            .then((res) => setSimilarChallenges(res.data.similar))
            .catch((err) => console.error(err));
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-ink flex items-center justify-center text-inkMuted">Loading...</div>;
    }

    if (error || !challenge) {
        return (
            <div className="min-h-screen bg-ink flex items-center justify-center text-red-400">
                {error || 'Challenge not found.'}
            </div>
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-inkMuted">
        Loading...
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-red-400">
        {error || 'Challenge not found.'}
      </div>
    );
  }

  const hasAiAnalysis = Boolean(
    challenge.aiAnalysis?.analyzedAt
  );

  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : '';

  return (
    <div className="min-h-screen bg-ink">

      {/* HEADER */}
      <header className="border-b border-panelLight">

        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <GitBranch
              size={20}
              className="text-signal"
            />

            <span className="font-display font-semibold text-lg text-ink50">
              SocioSolve
            </span>
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="text-sm text-inkMuted hover:text-ink50"
          >
            ← Back
          </button>

        </div>

      </header>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">

        {/* TITLE */}
        <div className="mb-10">

          <div className="flex items-center gap-3 mb-4 flex-wrap">

            <span className="font-mono text-xs uppercase text-inkMuted">
              {challenge.domain}

              {challenge.subCategory
                ? ` / ${challenge.subCategory}`
                : ''}
            </span>

            <StatusBadge status={challenge.status} />

          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink50 mb-4">
            {challenge.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-inkMuted">

            <span className="flex items-center gap-2">
              <MapPin size={15} />

              {challenge.district}

              {challenge.location
                ? ` — ${challenge.location}`
                : ''}
            </span>

            <span className="flex items-center gap-2">
              <Users size={15} />

              {challenge.peopleAffected || 0} affected
            </span>

          </div>

        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* CITIZEN SUBMISSION */}
            <div className="bg-panel border border-panelLight rounded-xl p-6">

              <div className="flex items-center gap-2 mb-6">

                <UserRound
                  size={19}
                  className="text-signal"
                />

                <h2 className="font-display text-lg font-semibold text-ink50">
                  Citizen Submission
                </h2>

              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">

                <p className="font-mono text-xs text-inkMuted uppercase mb-3">
                  Description
                </p>

                <div className="bg-ink/40 border border-panelLight rounded-lg p-5">

                  <p className="text-sm text-ink50 leading-7 whitespace-pre-line">
                    {challenge.description ||
                      'No description provided by the citizen.'}
                  </p>

                </div>

              </div>

              {/* LOCATION / AFFECTED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-ink/30 border border-panelLight rounded-lg p-4">

                  <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                    Location
                  </p>

                  <p className="text-sm text-ink50">
                    {challenge.district}

                    {challenge.location
                      ? ` — ${challenge.location}`
                      : ''}
                  </p>

                </div>

                <div className="bg-ink/30 border border-panelLight rounded-lg p-4">

                  <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                    People affected
                  </p>

                  <p className="text-sm text-ink50">
                    {challenge.peopleAffected || 0}
                  </p>

                </div>

                {similarChallenges.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold text-ink50 mb-4">
                            Similar challenges
                        </h2>
                        <div className="flex flex-col gap-3">
                            {similarChallenges.map((s) => {
                                const isDuplicate = s.similarity >= 65;
                                return (
                                    <Link
                                        key={s.challenge?._id}
                                        to={`/challenges/${s.challenge?._id}`}
                                        className={`flex items-center justify-between rounded-lg px-5 py-4 border transition-colors ${isDuplicate
                                                ? 'bg-signal/5 border-signal/30 hover:border-signal/60'
                                                : 'bg-panel border-panelLight hover:border-pulse/40'
                                            }`}
                                    >
                                        <div>
                                            {isDuplicate && (
                                                <p className="font-mono text-[10px] uppercase text-signal mb-1">
                                                    Potential duplicate
                                                </p>
                                            )}
                                            <span className="text-sm text-ink50">{s.challenge?.title}</span>
                                        </div>
                                        <span
                                            className={`font-mono text-xs ${isDuplicate ? 'text-signal' : 'text-pulse'
                                                }`}
                                        >
                                            Similarity: {Math.round(s.similarity)}%
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <p className="text-xs text-inkMuted mt-2">
                          Evidence photo {index + 1}
                        </p>

                      </a>

                    )
                  )}

                </div>

              </div>
            )}

            {/* VIDEOS */}
            {challenge.media?.videos?.length > 0 && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h2 className="font-display text-lg font-semibold text-ink50 mb-5">
                  Citizen Videos
                </h2>

                <div className="flex flex-col gap-4">

                  {challenge.media.videos.map(
                    (src, index) => (

                      <div key={src}>

                        <video
                          src={`${apiBase}${src}`}
                          controls
                          className="w-full rounded-lg border border-panelLight"
                        />

                        <p className="text-xs text-inkMuted mt-2">
                          Video {index + 1}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

            {/* DOCUMENTS */}
            {challenge.media?.documents?.length > 0 && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h2 className="font-display text-lg font-semibold text-ink50 mb-5">
                  Citizen Documents
                </h2>

                <div className="flex flex-col gap-3">

                  {challenge.media.documents.map(
                    (src, index) => (

                      <a
                        key={src}
                        href={`${apiBase}${src}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-ink/30 border border-panelLight rounded-lg px-4 py-3 text-sm text-signal hover:border-signal transition-colors"
                      >

                        <FileText size={17} />

                        Citizen document {index + 1}

                      </a>

                    )
                  )}

                </div>

              </div>
            )}

            {/* LOCATION */}
            {(challenge.latitude ||
              challenge.longitude) && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h2 className="font-display text-lg font-semibold text-ink50 mb-4">
                  Reported Location
                </h2>

                <div className="bg-ink border border-panelLight rounded-lg h-48 flex items-center justify-center">

                  <div className="text-center">

                    <MapPin
                      size={30}
                      className="text-signal mx-auto mb-3"
                    />

                    <p className="font-mono text-xs text-inkMuted">
                      {challenge.latitude},{' '}
                      {challenge.longitude}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* PROGRESS */}
            <div className="bg-panel border border-panelLight rounded-xl p-6">

              <h2 className="font-display text-lg font-semibold text-ink50 mb-6">
                Progress
              </h2>

              <Timeline
                status={challenge.status}
              />

            </div>

            <div className="flex flex-col gap-8">


                {challenge.recommendedUniversities?.length > 0 && (
                    <div className="bg-panel border border-panelLight rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-sm font-semibold text-ink50">
                                Recommended universities
                            </h3>
                            {['university', 'government', 'admin'].includes(user?.role) && (
                                <button
                                    onClick={async () => {
                                        setRefreshingRecs(true);
                                        try {
                                            const { data } = await refreshRecommendations(challenge._id);
                                            setChallenge(data.challenge);
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            setRefreshingRecs(false);
                                        }
                                    }}
                                    disabled={refreshingRecs}
                                    className="text-xs text-signal hover:underline disabled:opacity-50"
                                >
                                    {refreshingRecs ? 'Refreshing...' : 'Refresh'}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-5">
                            {challenge.recommendedUniversities.map((r, i) => (
                                <div key={r.university?._id || i}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-ink50">
                                            {r.university?.name || (
                                                <span className="text-inkMuted italic">
                                                    University no longer available
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-mono text-xs text-pulse">{r.matchScore}% Match</span>
                                    </div>
                                    {r.matchedExpertise?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {r.matchedExpertise.map((e) => (
                                                <span
                                                    key={e}
                                                    className="font-mono text-[10px] bg-pulse/10 text-pulse rounded px-1.5 py-0.5"
                                                >
                                                    ✓ {e}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                  </div>

                  {/* PRIORITY */}
                  <div>

                    <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                      Priority
                    </p>

                    <span className="inline-flex px-3 py-1.5 rounded-md bg-signal/10 text-signal font-mono text-xs uppercase">
                      {challenge.aiAnalysis.priority ||
                        'Not specified'}
                    </span>

                  </div>

                  {/* KEYWORDS */}
                  {challenge.aiAnalysis.keywords
                    ?.length > 0 && (
                    <div>

                      <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                        Keywords
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {challenge.aiAnalysis.keywords.map(
                          (keyword) => (

                            <span
                              key={keyword}
                              className="font-mono text-[11px] bg-panelLight rounded px-2 py-1 text-inkMuted"
                            >
                              {keyword}
                            </span>

                          )
                        )}

                      </div>

                    </div>
                  )}

                  {/* REQUIRED EXPERTISE */}
                  {challenge.aiAnalysis.requiredExpertise
                    ?.length > 0 && (
                    <div>

                      <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                        Required expertise
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {challenge.aiAnalysis.requiredExpertise.map(
                          (expertise) => (

                            <span
                              key={expertise}
                              className="font-mono text-[11px] bg-signal/10 text-signal rounded px-2 py-1"
                            >
                              {expertise}
                            </span>

                          )
                        )}

                      </div>

                    </div>
                  )}

                </div>

              )}

            </div>

            {/* RECOMMENDED UNIVERSITIES */}
            {challenge.recommendedUniversities
              ?.length > 0 && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h3 className="font-display text-sm font-semibold text-ink50 mb-5">
                  Recommended universities
                </h3>

                <div className="flex flex-col gap-5">

                  {challenge.recommendedUniversities.map(
                    (r) => (

                      <div
                        key={r.university?._id}
                      >

                        <div className="flex items-center justify-between mb-2">

                          <span className="text-sm text-ink50">
                            {r.university?.name}
                          </span>

                          <span className="font-mono text-xs text-pulse">
                            {r.matchScore}% Match
                          </span>

                        </div>

                        {r.matchedExpertise
                          ?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">

                            {r.matchedExpertise.map(
                              (expertise) => (

                                <span
                                  key={expertise}
                                  className="font-mono text-[10px] bg-pulse/10 text-pulse rounded px-1.5 py-0.5"
                                >
                                  ✓ {expertise}
                                </span>

                              )
                            )}

                          </div>
                        )}

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

            {/* ASSIGNED UNIVERSITY */}
            {challenge.assignedUniversity && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h3 className="font-display text-sm font-semibold text-ink50 mb-2">
                  Assigned university
                </h3>

                <p className="text-sm text-ink50">
                  {challenge.assignedUniversity.name}
                </p>

                <p className="text-xs text-inkMuted mt-1 mb-4">
                  {challenge.assignedUniversity.district}
                </p>

                {!challenge.project &&
                  user?.role === 'university' && (

                    <button
                      onClick={async () => {

                        setCreatingProject(true);

                        try {

                          const { data } =
                            await createProject(
                              challenge._id
                            );

                          navigate(
                            `/university/projects/${data.project._id}`
                          );

                        } catch (err) {

                          console.error(err);

                        } finally {

                          setCreatingProject(false);

                        }

                      }}
                      className="w-full bg-signal text-ink text-sm font-medium rounded-md py-2.5 hover:bg-amber-400 transition-colors disabled:opacity-50"
                      disabled={creatingProject}
                    >
                      {creatingProject
                        ? 'Creating project...'
                        : 'Create project'}
                    </button>

                  )}

              </div>
            )}

            {/* PROJECT */}
            {challenge.project && (
              <div className="bg-panel border border-panelLight rounded-xl p-6">

                <h3 className="font-display text-sm font-semibold text-ink50 mb-4">
                  Project
                </h3>

                <p className="text-sm text-ink50 mb-1">
                  {challenge.project.title}
                </p>

                <p className="text-xs text-inkMuted mb-4">
                  Status: {challenge.project.status}
                </p>

                {challenge.project.industryPartners
                  ?.length > 0 && (
                  <div className="pt-4 border-t border-panelLight">

                    <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                      Industry partners
                    </p>

                    {challenge.project.industryPartners.map(
                      (partner) => (

                        <p
                          key={partner.partner?._id}
                          className="text-sm text-ink50"
                        >
                          {partner.partner?.name}
                        </p>

                      )
                    )}

                  </div>
                )}

                {challenge.project.socialImpact
                  ?.peopleImpacted > 0 && (
                  <div className="pt-4 border-t border-panelLight mt-4">

                    <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                      Social impact
                    </p>

                    <p className="text-sm text-ink50">
                      {
                        challenge.project.socialImpact
                          .peopleImpacted
                      }{' '}
                      people impacted
                    </p>

                    <p className="text-xs text-inkMuted mt-1">
                      {
                        challenge.project.socialImpact
                          .description
                      }
                    </p>

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}