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
import { useSelector } from 'react-redux';

import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';

import {
  getChallengeById,
  triggerAnalysis,
  getSimilarChallenges,
} from '../../services/challengeService';

import { createProject } from '../../services/projectService';
import { refreshRecommendations } from '../../services/universityService';

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

  /*
   * API base URL
   *
   * VITE_API_URL normally looks like:
   * https://your-backend.onrender.com/api
   *
   * Uploaded media is served from:
   * https://your-backend.onrender.com/uploads/...
   */
  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : '';

  /* =========================================================
     LOAD CHALLENGE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError('');

    getChallengeById(id)
      .then((res) => {
        if (mounted) {
          setChallenge(res.data.challenge);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              'Could not load this challenge.'
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    /*
     * Similar challenges are calculated live instead of relying
     * on challenge.similarChallenges, because that field may be
     * an old snapshot.
     */
    getSimilarChallenges(id)
      .then((res) => {
        if (mounted) {
          setSimilarChallenges(res.data.similar || []);
        }
      })
      .catch((err) => {
        console.error('Could not load similar challenges:', err);

        if (mounted) {
          setSimilarChallenges([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-inkMuted">
        Loading...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error || !challenge) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-red-400">
        {error || 'Challenge not found.'}
      </div>
    );
  }

  /* =========================================================
     AI ANALYSIS
  ========================================================= */

  const hasAiAnalysis = Boolean(
    challenge.aiAnalysis?.analyzedAt
  );

  const handleAnalysis = async () => {
    setAnalyzing(true);

    try {
      const { data } = await triggerAnalysis(challenge._id);

      /*
       * Depending on your backend response structure,
       * the updated challenge may be returned as:
       * data.challenge
       */
      if (data?.challenge) {
        setChallenge(data.challenge);
      } else {
        /*
         * If the backend doesn't return the challenge,
         * reload it from the server.
         */
        const response = await getChallengeById(challenge._id);
        setChallenge(response.data.challenge);
      }

      /*
       * Refresh similar challenges after AI analysis because
       * analysis may affect duplicate/similarity information.
       */
      try {
        const similarResponse = await getSimilarChallenges(
          challenge._id
        );

        setSimilarChallenges(
          similarResponse.data.similar || []
        );
      } catch (similarError) {
        console.error(
          'Could not refresh similar challenges:',
          similarError
        );
      }
    } catch (err) {
      console.error('AI analysis failed:', err);

      setError(
        err.response?.data?.message ||
          'Could not analyze this challenge.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  /* =========================================================
     REFRESH UNIVERSITY RECOMMENDATIONS
  ========================================================= */

  const handleRefreshRecommendations = async () => {
    setRefreshingRecs(true);

    try {
      const { data } = await refreshRecommendations(
        challenge._id
      );

      if (data?.challenge) {
        setChallenge(data.challenge);
      }
    } catch (err) {
      console.error(
        'Could not refresh recommendations:',
        err
      );
    } finally {
      setRefreshingRecs(false);
    }
  };

  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  const handleCreateProject = async () => {
    setCreatingProject(true);

    try {
      const { data } = await createProject(
        challenge._id
      );

      if (data?.project?._id) {
        navigate(
          `/university/projects/${data.project._id}`
        );
      }
    } catch (err) {
      console.error('Could not create project:', err);
    } finally {
      setCreatingProject(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-ink">

      {/* =====================================================
          HEADER
      ===================================================== */}

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
            className="text-sm text-inkMuted hover:text-ink50 transition-colors"
          >
            ← Back
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10">

        {/* ===================================================
            TITLE
        =================================================== */}

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

        {/* ===================================================
            CONTENT GRID
        =================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* =================================================
                CITIZEN SUBMISSION
            ================================================= */}

            <section className="bg-panel border border-panelLight rounded-xl p-6">

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

              {/* LOCATION + PEOPLE AFFECTED */}

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

              </div>

            </section>

            {/* =================================================
                EVIDENCE IMAGES
            ================================================= */}

            {challenge.media?.images?.length > 0 && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

                <div className="flex items-center gap-2 mb-5">

                  <ImageIcon
                    size={19}
                    className="text-signal"
                  />

                  <h2 className="font-display text-lg font-semibold text-ink50">
                    Evidence Photos
                  </h2>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {challenge.media.images.map(
                    (src, index) => (

                      <div key={src}>

                        <img
                          src={`${apiBase}${src}`}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg border border-panelLight"
                        />

                        <p className="text-xs text-inkMuted mt-2">
                          Evidence photo {index + 1}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </section>
            )}

            {/* =================================================
                VIDEOS
            ================================================= */}

            {challenge.media?.videos?.length > 0 && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

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

              </section>
            )}

            {/* =================================================
                DOCUMENTS
            ================================================= */}

            {challenge.media?.documents?.length > 0 && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

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

              </section>
            )}

            {/* =================================================
                GPS LOCATION
            ================================================= */}

            {(challenge.latitude != null &&
              challenge.longitude != null) && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

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

              </section>
            )}

            {/* =================================================
                PROGRESS
            ================================================= */}

            <section className="bg-panel border border-panelLight rounded-xl p-6">

              <h2 className="font-display text-lg font-semibold text-ink50 mb-6">
                Progress
              </h2>

              <Timeline
                status={challenge.status}
              />

            </section>

            {/* =================================================
                SIMILAR CHALLENGES
            ================================================= */}

            {similarChallenges.length > 0 && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

                <div className="flex items-center justify-between mb-5">

                  <h2 className="font-display text-lg font-semibold text-ink50">
                    Similar Challenges
                  </h2>

                </div>

                <div className="flex flex-col gap-3">

                  {similarChallenges.map((s) => {

                    const isDuplicate =
                      s.similarity >= 65;

                    const similarId =
                      s.challenge?._id;

                    if (!similarId) {
                      return null;
                    }

                    return (
                      <Link
                        key={similarId}
                        to={`/challenges/${similarId}`}
                        className={`flex items-center justify-between gap-4 rounded-lg px-5 py-4 border transition-colors ${
                          isDuplicate
                            ? 'bg-signal/5 border-signal/30 hover:border-signal/60'
                            : 'bg-panel border-panelLight hover:border-pulse/40'
                        }`}
                      >

                        <div className="min-w-0">

                          {isDuplicate && (
                            <p className="font-mono text-[10px] uppercase text-signal mb-1">
                              Potential duplicate
                            </p>
                          )}

                          <span className="text-sm text-ink50">
                            {s.challenge?.title ||
                              'Untitled challenge'}
                          </span>

                        </div>

                        <span
                          className={`font-mono text-xs whitespace-nowrap ${
                            isDuplicate
                              ? 'text-signal'
                              : 'text-pulse'
                          }`}
                        >
                          Similarity:{' '}
                          {Math.round(
                            s.similarity || 0
                          )}
                          %
                        </span>

                      </Link>
                    );
                  })}

                </div>

              </section>
            )}

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <div className="flex flex-col gap-8">

            {/* =================================================
                AI ANALYSIS
            ================================================= */}

            <section className="bg-panel border border-panelLight rounded-xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-2">

                  <Sparkles
                    size={19}
                    className="text-signal"
                  />

                  <h2 className="font-display text-lg font-semibold text-ink50">
                    AI Analysis
                  </h2>

                </div>

                <button
                  onClick={handleAnalysis}
                  disabled={analyzing}
                  className="flex items-center gap-2 text-xs text-signal hover:underline disabled:opacity-50"
                >

                  <RefreshCw
                    size={13}
                    className={
                      analyzing
                        ? 'animate-spin'
                        : ''
                    }
                  />

                  {analyzing
                    ? 'Analyzing...'
                    : hasAiAnalysis
                      ? 'Re-analyze'
                      : 'Analyze'}

                </button>

              </div>

              {!hasAiAnalysis ? (
                <div className="bg-ink/30 border border-panelLight rounded-lg p-5 text-center">

                  <Sparkles
                    size={28}
                    className="text-signal mx-auto mb-3"
                  />

                  <p className="text-sm text-ink50 mb-2">
                    AI analysis has not been performed yet.
                  </p>

                  <p className="text-xs text-inkMuted">
                    Analyze this challenge to identify its
                    category, priority, keywords, and required
                    expertise.
                  </p>

                </div>
              ) : (
                <div className="flex flex-col gap-6">

                  {/* SUMMARY */}

                  {challenge.aiAnalysis.summary && (
                    <div>

                      <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                        Summary
                      </p>

                      <p className="text-sm text-ink50 leading-6">
                        {challenge.aiAnalysis.summary}
                      </p>

                    </div>
                  )}

                  {/* CATEGORY */}

                  {(challenge.aiAnalysis.category ||
                    challenge.aiAnalysis.subCategory) && (
                    <div>

                      <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                        Classification
                      </p>

                      <p className="text-sm text-ink50">

                        {challenge.aiAnalysis.category ||
                          'Not specified'}

                        {challenge.aiAnalysis.subCategory
                          ? ` / ${challenge.aiAnalysis.subCategory}`
                          : ''}

                      </p>

                    </div>
                  )}

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

                  {/* ANALYZED DATE */}

                  {challenge.aiAnalysis.analyzedAt && (
                    <p className="font-mono text-[10px] text-inkMuted">
                      Analyzed:{' '}
                      {new Date(
                        challenge.aiAnalysis.analyzedAt
                      ).toLocaleString()}
                    </p>
                  )}

                </div>
              )}

            </section>

            {/* =================================================
                RECOMMENDED UNIVERSITIES
            ================================================= */}

            {challenge.recommendedUniversities
              ?.length > 0 && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

                <div className="flex items-center justify-between mb-5">

                  <h2 className="font-display text-lg font-semibold text-ink50">
                    Recommended Universities
                  </h2>

                  {[
                    'university',
                    'government',
                    'admin',
                  ].includes(user?.role) && (
                    <button
                      onClick={
                        handleRefreshRecommendations
                      }
                      disabled={refreshingRecs}
                      className="flex items-center gap-2 text-xs text-signal hover:underline disabled:opacity-50"
                    >

                      <RefreshCw
                        size={13}
                        className={
                          refreshingRecs
                            ? 'animate-spin'
                            : ''
                        }
                      />

                      {refreshingRecs
                        ? 'Refreshing...'
                        : 'Refresh'}

                    </button>
                  )}

                </div>

                <div className="flex flex-col gap-5">

                  {challenge.recommendedUniversities.map(
                    (r, index) => (

                      <div
                        key={
                          r.university?._id || index
                        }
                      >

                        <div className="flex items-center justify-between gap-3 mb-2">

                          <span className="text-sm text-ink50">
                            {r.university?.name || (
                              <span className="text-inkMuted italic">
                                University no longer available
                              </span>
                            )}
                          </span>

                          <span className="font-mono text-xs text-pulse whitespace-nowrap">
                            {r.matchScore || 0}% Match
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

              </section>
            )}

            {/* =================================================
                ASSIGNED UNIVERSITY
            ================================================= */}

            {challenge.assignedUniversity && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

                <h2 className="font-display text-lg font-semibold text-ink50 mb-2">
                  Assigned University
                </h2>

                <p className="text-sm text-ink50">
                  {challenge.assignedUniversity.name}
                </p>

                {challenge.assignedUniversity.district && (
                  <p className="text-xs text-inkMuted mt-1 mb-4">
                    {challenge.assignedUniversity.district}
                  </p>
                )}

                {!challenge.project &&
                  user?.role === 'university' && (
                    <button
                      onClick={handleCreateProject}
                      disabled={creatingProject}
                      className="w-full bg-signal text-ink text-sm font-medium rounded-md py-2.5 hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      {creatingProject
                        ? 'Creating project...'
                        : 'Create Project'}
                    </button>
                  )}

              </section>
            )}

            {/* =================================================
                PROJECT
            ================================================= */}

            {challenge.project && (
              <section className="bg-panel border border-panelLight rounded-xl p-6">

                <h2 className="font-display text-lg font-semibold text-ink50 mb-4">
                  Project
                </h2>

                <p className="text-sm text-ink50 mb-1">
                  {challenge.project.title}
                </p>

                <p className="text-xs text-inkMuted mb-4">
                  Status: {challenge.project.status}
                </p>

                {/* INDUSTRY PARTNERS */}

                {challenge.project.industryPartners
                  ?.length > 0 && (
                  <div className="pt-4 border-t border-panelLight">

                    <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                      Industry Partners
                    </p>

                    <div className="flex flex-col gap-1">

                      {challenge.project.industryPartners.map(
                        (partner, index) => (

                          <p
                            key={
                              partner.partner?._id ||
                              index
                            }
                            className="text-sm text-ink50"
                          >
                            {partner.partner?.name ||
                              'Unknown partner'}
                          </p>

                        )
                      )}

                    </div>

                  </div>
                )}

                {/* SOCIAL IMPACT */}

                {challenge.project.socialImpact
                  ?.peopleImpacted > 0 && (
                  <div className="pt-4 border-t border-panelLight mt-4">

                    <p className="font-mono text-xs text-inkMuted uppercase mb-2">
                      Social Impact
                    </p>

                    <p className="text-sm text-ink50">
                      {
                        challenge.project.socialImpact
                          .peopleImpacted
                      }{' '}
                      people impacted
                    </p>

                    {challenge.project.socialImpact
                      .description && (
                      <p className="text-xs text-inkMuted mt-1">
                        {
                          challenge.project.socialImpact
                            .description
                        }
                      </p>
                    )}

                  </div>
                )}

              </section>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}