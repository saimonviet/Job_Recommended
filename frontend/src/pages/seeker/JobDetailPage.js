import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import TopNavBar from '../../components/TopNavBar';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const API_URL = 'http://127.0.0.1:5000';

  // Check if user is logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user && job) {
        setIsSaved(user.saved_jobs && user.saved_jobs.includes(job.id));
    }
  }, [user, job]);

  const handleSaveToggle = async () => {
    if (!user) {
        navigate('/login-seeker');
        return;
    }

    try {
        if (isSaved) {
            await api.unsaveJob(jobId);
            setIsSaved(false);
        } else {
            await api.saveJob(jobId);
            setIsSaved(true);
        }
    } catch (error) {
        console.error('Error saving/unsaving job:', error);
    }
  };

  // Fetch job data from API
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();
        setJob(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Không thể tải thông tin công việc');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const buildMapEmbedUrl = (coords) => {
    if (!coords) return '';

    const delta = 0.01;
    const left = (coords.lon - delta).toFixed(6);
    const right = (coords.lon + delta).toFixed(6);
    const top = (coords.lat + delta).toFixed(6);
    const bottom = (coords.lat - delta).toFixed(6);
    const marker = `${coords.lat.toFixed(6)}%2C${coords.lon.toFixed(6)}`;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${marker}`;
  };

  const buildMapOpenUrl = (coords) => {
    if (!coords) return '';

    return `https://www.openstreetmap.org/?mlat=${coords.lat.toFixed(6)}&mlon=${coords.lon.toFixed(6)}#map=15/${coords.lat.toFixed(6)}/${coords.lon.toFixed(6)}`;
  };

  useEffect(() => {
    const fetchCoordinates = async () => {
      const detailAddress = job?.job_detail_address || job?.detail_address;
      if (!detailAddress) {
        setMapCoords(null);
        return;
      }

      setMapLoading(true);
      try {
        const query = encodeURIComponent(`${detailAddress}, Vietnam`);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`, {
          headers: {
            'Accept-Language': 'vi',
          },
        });

        if (!response.ok) {
          throw new Error(`Geocoding error: ${response.status}`);
        }

        const result = await response.json();
        if (Array.isArray(result) && result.length > 0) {
          setMapCoords({
            lat: Number(result[0].lat),
            lon: Number(result[0].lon),
          });
        } else {
          setMapCoords(null);
        }
      } catch (geocodingError) {
        console.error('Error geocoding location:', geocodingError);
        setMapCoords(null);
      } finally {
        setMapLoading(false);
      }
    };

    fetchCoordinates();
  }, [job?.job_detail_address, job?.detail_address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>hourglass_top</span>
          </div>
          <p className="text-lg text-on-surface-variant">Đang tải dữ liệu công việc...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error || 'Không thể tải công việc'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: #f9f9ff; 
          color: #191c21; 
        }
        h1, h2, h3 { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>

      {/* TopNavBar - use authenticated nav if logged in */}
      {user ? (
        <TopNavBar currentPage="jobs" />
      ) : (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center px-8 py-4 max-w-full">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary font-bold text-lg hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Career Authority
          </button>
          <div className="hidden md:flex gap-8 items-center">
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#forecast">Dự báo</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#market">Thị trường</a>
            <a className="text-primary font-bold border-b-2 border-primary" href="#jobs">Công ty</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#about">Về chúng tôi</a>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => navigate('/login-seeker')}
              className="text-primary font-medium px-4 py-2 hover:opacity-80 transition-opacity cursor-pointer bg-none border-none"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => navigate('/register-seeker')}
              className="bg-primary text-on-primary px-6 py-2 rounded-md font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              Tham gia ngay
            </button>
          </div>
        </nav>
      )}

      <main className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        {/* Hero Header Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>business</span>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
                  {job.title}
                </h1>
                <p className="text-xl text-primary font-medium">{job.company}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-10">
              <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>payments</span>
                <span className="text-sm font-semibold">{job.salary_min} - {job.salary_max}</span>
              </div>
              <div className="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>location_on</span>
                <span className="text-sm font-semibold">{job.location || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>

          {/* Action Column */}
          <div className="lg:col-span-4 flex flex-col gap-4 sticky top-28">
            <button
              onClick={() => alert('Tính năng ứng tuyển sẽ được cập nhật sớm!')}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Ứng tuyển ngay
            </button>
            <div className="flex gap-4">
              <button 
                onClick={handleSaveToggle}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors ${
                    isSaved 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined">{isSaved ? 'bookmark_added' : 'bookmark'}</span> 
                {isSaved ? 'Đã lưu' : 'Lưu'}
              </button>
              <button className="flex-1 bg-surface-container-high py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">share</span> Chia sẻ
              </button>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Details */}
          <div className="lg:col-span-8 space-y-16">
            {/* Description */}
            <article>
              <h2 className="text-2xl font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">
                MỤC TIÊU CÔNG VIỆC
              </h2>
              <div className="space-y-4 text-on-surface-variant leading-relaxed text-lg text-justify job-description">
                <p>{formatText(job.description)}</p>
              </div>
            </article>

            {/* Requirements */}
            <article>
              <h2 className="text-2xl font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">
                YÊU CẦU CÔNG VIỆC
              </h2>
              <div className="space-y-4 text-on-surface-variant text-lg text-justify job-requirement">
                <p>{formatText(job.requirement)}</p>
              </div>
            </article>

            {/* Job Info */}
            <article>
              <h2 className="text-2xl font-bold text-on-surface mb-6 border-b border-outline-variant/20 pb-4">
                Phúc lợi
              </h2>
              {job.benefits}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: '32px', display: 'block' }}>
                    calendar_today
                  </span>
                  <h4 className="font-bold text-on-surface mb-1">Hạn chót ứng tuyển</h4>
                  <p className="text-sm text-on-surface-variant">{formatDate(job.deadline)}</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: '32px', display: 'block' }}>
                    work
                  </span>
                  <h4 className="font-bold text-on-surface mb-1">Loại hợp đồng</h4>
                  <p className="text-sm text-on-surface-variant">{job.employmentType || 'Chưa cập nhật'}</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: '32px', display: 'block' }}>
                    school
                  </span>
                  <h4 className="font-bold text-on-surface mb-1">Kinh nghiệm yêu cầu</h4>
                  <p className="text-sm text-on-surface-variant">{job.exp_min && job.exp_max ? `${job.exp_min} - ${job.exp_max} năm` : 'Chưa cập nhật'}</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: '32px', display: 'block' }}>
                    category
                  </span>
                  <h4 className="font-bold text-on-surface mb-1">Chức năng công việc</h4>
                  <p className="text-sm text-on-surface-variant">{job.jobFunction || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </article>
          </div>

          {/* Right Column: Competition Analysis */}
          <div className="lg:col-span-4 space-y-8">
            {/* Location Card */}
            <div className="bg-surface-container-low rounded-3xl overflow-hidden">
              <div className="h-48 bg-surface-dim relative">
                {mapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-on-surface-variant">Đang tải bản đồ...</span>
                  </div>
                )}

                {!mapLoading && mapCoords && (
                  <>
                    <iframe
                      title="Bản đồ vị trí công việc"
                      src={buildMapEmbedUrl(mapCoords)}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <a
                      href={buildMapOpenUrl(mapCoords)}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-full text-xs font-bold shadow"
                    >
                      Xem bản đồ
                    </a>
                  </>
                )}

                {!mapLoading && !mapCoords && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '48px' }}>
                      map
                    </span>
                    <span className="text-xs text-on-surface-variant">Không tìm thấy tọa độ cho địa chỉ này</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h4 className="font-bold mb-1">{job.job_detail_address || 'Chưa cập nhật'}</h4>
                <p className="text-xs text-on-surface-variant">{job.company}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low flex flex-col md:flex-row justify-between items-center px-12 py-12 gap-8 border-t-0">
        <div className="text-lg font-black text-on-surface">Career Authority</div>
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:underline transition-all" href="#">
            Chính sách bảo mật
          </a>
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:underline transition-all" href="#">
            Điều khoản dịch vụ
          </a>
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:underline transition-all" href="#">
            Hỗ trợ
          </a>
          <a className="text-on-surface-variant text-xs uppercase tracking-widest hover:underline transition-all" href="#">
            Phương pháp AI
          </a>
        </div>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest opacity-80">
          © 2024 The Predictive Career Authority. Bảo lưu mọi quyền.
        </p>
      </footer>
    </>
  );
};

export default JobDetailPage;
