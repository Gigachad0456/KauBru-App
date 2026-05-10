import { useState, useEffect } from 'react'
import { adminApi } from '../api'

export default function JobManagerPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [filter, setFilter] = useState('')

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await adminApi.jobs({ status: filter || undefined })
      setJobs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [filter])

  const handleFetch = async () => {
    setFetching(true)
    try {
      const res = await adminApi.fetchJobsNow()
      alert(`Fetch Complete: added ${res.data.summary.added}, errors ${res.data.summary.errors}`)
      loadJobs()
    } catch (e: any) {
      alert(`Fetch failed: ${e.response?.data?.detail || e.message}`)
    } finally {
      setFetching(false)
    }
  }

  const handlePublish = async (id: number) => {
    try { await adminApi.publishJob(id); loadJobs() } catch (e) { console.error(e) }
  }
  const handleReject = async (id: number) => {
    try { await adminApi.rejectJob(id); loadJobs() } catch (e) { console.error(e) }
  }
  const handleToggleClose = async (job: any) => {
    try {
      if (job.is_open) await adminApi.closeJob(job.id)
      else await adminApi.openJob(job.id)
      loadJobs()
    } catch (e) { console.error(e) }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    try { await adminApi.deleteJob(id); loadJobs() } catch (e) { console.error(e) }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Job Manager</h2>
        <div className="flex gap-4 items-center">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="bg-white/10 text-white rounded px-3 py-2 border border-white/20"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          <button 
            onClick={handleFetch}
            disabled={fetching}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {fetching ? 'Fetching...' : 'Fetch Job Notices'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="p-4 rounded-xl border border-white/10" style={{ background: 'var(--bg-card)' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{job.title}</h3>
                  <p className="text-sm text-white/70">{job.organization} • {job.location} • {job.job_type}</p>
                </div>
                <div className="flex gap-2">
                  {job.status === 'pending' && (
                    <>
                      <button onClick={() => handlePublish(job.id)} className="px-3 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 text-sm font-medium">Publish</button>
                      <button onClick={() => handleReject(job.id)} className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 text-sm font-medium">Reject</button>
                    </>
                  )}
                  {job.status === 'published' && (
                    <button onClick={() => handleToggleClose(job)} className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded hover:bg-orange-600/40 text-sm font-medium">
                      {job.is_open ? 'Mark Closed' : 'Mark Open'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(job.id)} className="px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 text-sm font-medium">Delete</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-white/80">
                <div>
                  <span className="text-white/50 block text-xs">Status</span>
                  <span className={`capitalize ${job.status === 'pending' ? 'text-yellow-400' : job.status === 'published' ? 'text-green-400' : 'text-red-400'}`}>{job.status}</span>
                </div>
                <div>
                  <span className="text-white/50 block text-xs">Job Status</span>
                  <span>{job.job_status}</span>
                </div>
                <div>
                  <span className="text-white/50 block text-xs">Qualifications</span>
                  <span>{job.qualification_tags?.join(', ') || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-white/50 block text-xs">Last Date</span>
                  <span>{job.last_date || 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-4">
                <a href={job.source_link} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline">View Source</a>
                {job.apply_link && <a href={job.apply_link} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline">Apply Link</a>}
              </div>
            </div>
          ))}
          {jobs.length === 0 && <div className="text-white/50 text-center py-8">No jobs found.</div>}
        </div>
      )}
    </div>
  )
}
