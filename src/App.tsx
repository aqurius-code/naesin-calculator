import React, { useState } from 'react';
import './App.css';

type Tab = 'grade' | 'avg' | 'guide' | 'reverse';

interface Subject {
  id: number;
  name: string;
  grade: string;
  unit: string;
}

// 등급 계산 (중간석차 공식 적용)
function calcGrade(total: number, rank: number, tied: number): { grade: number; percentile: number } {
  const midRank = rank + (tied - 1) / 2;
  const percentile = (midRank / total) * 100;
  if (percentile <= 10) return { grade: 1, percentile };
  if (percentile <= 34) return { grade: 2, percentile };
  if (percentile <= 66) return { grade: 3, percentile };
  if (percentile <= 90) return { grade: 4, percentile };
  return { grade: 5, percentile };
}

// 성취도 계산
function calcAchievement(percentile: number): string {
  if (percentile <= 10) return 'A';
  if (percentile <= 34) return 'B';
  if (percentile <= 66) return 'C';
  if (percentile <= 90) return 'D';
  return 'E';
}

// 등급별 클래스
function gradeClass(g: number): string {
  return ['', 'grade1', 'grade2', 'grade3', 'grade4', 'grade5'][g] || 'neutral';
}

// 역산: 목표 등급이 되려면 몇 등 안에 들어야 하는지
function calcTargetRank(total: number, targetGrade: number): number {
  const cuts = [0, 10, 34, 66, 90, 100];
  return Math.floor((cuts[targetGrade] / 100) * total);
}

export default function App() {
  const hash = window.location.hash.replace('#', '') as Tab;
  const [tab, setTab] = useState<Tab>(['grade','avg','reverse','guide'].includes(hash) ? hash : 'grade');

  // 탭1: 과목 등급 계산기
  const [total, setTotal] = useState('');
  const [rank, setRank] = useState('');
  const [tied, setTied] = useState('1');
  const [gradeResult, setGradeResult] = useState<{ grade: number; percentile: number } | null>(null);

  // 탭2: 평균 계산기
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: '', grade: '1', unit: '4' },
    { id: 2, name: '', grade: '1', unit: '4' },
  ]);
  const [avgResult, setAvgResult] = useState<number | null>(null);

  // 탭4: 역산 계산기
  const [rTotal, setRTotal] = useState('');
  const [rRank, setRRank] = useState('');
  const [rTied, setRTied] = useState('1');
  const [targetGrade, setTargetGrade] = useState<number>(1);
  const [reverseResult, setReverseResult] = useState<{ current: number; target: number; need: number } | null>(null);

  // 탭1 계산
  const handleCalcGrade = () => {
    const t = parseInt(total), r = parseInt(rank), ti = parseInt(tied) || 1;
    if (!t || !r || t < 1 || r < 1 || r > t) return;
    setGradeResult(calcGrade(t, r, ti));
  };

  // 탭2 과목 추가/삭제
  const addSubject = () => setSubjects(s => [...s, { id: Date.now(), name: '', grade: '1', unit: '4' }]);
  const removeSubject = (id: number) => setSubjects(s => s.filter(x => x.id !== id));
  const updateSubject = (id: number, field: keyof Subject, val: string) => {
    setSubjects(s => s.map(x => x.id === id ? { ...x, [field]: val } : x));
  };

  // 탭2 평균 계산
  const handleCalcAvg = () => {
    const valid = subjects.filter(s => s.grade && s.unit && parseFloat(s.unit) > 0);
    if (valid.length === 0) return;
    const totalUnit = valid.reduce((acc, s) => acc + parseFloat(s.unit), 0);
    const weightedSum = valid.reduce((acc, s) => acc + parseInt(s.grade) * parseFloat(s.unit), 0);
    setAvgResult(Math.round((weightedSum / totalUnit) * 100) / 100);
  };

  // 탭4 역산 계산
  const handleCalcReverse = () => {
    const t = parseInt(rTotal), r = parseInt(rRank), ti = parseInt(rTied) || 1;
    if (!t || !r || r > t) return;
    const current = calcGrade(t, r, ti).grade;
    const targetRank = calcTargetRank(t, targetGrade);
    const need = r - targetRank;
    setReverseResult({ current, target: targetGrade, need });
  };

  return (
    <div className="app">
      <div className="header">
        <p className="header-title">고교학점제 내신계산기</p>
        <div className="tab-nav">
          <button className={`tab-btn ${tab === 'grade' ? 'active' : ''}`} onClick={() => setTab('grade')}>등급계산</button>
          <button className={`tab-btn ${tab === 'avg' ? 'active' : ''}`} onClick={() => setTab('avg')}>평균계산</button>
          <button className={`tab-btn ${tab === 'reverse' ? 'active' : ''}`} onClick={() => setTab('reverse')}>등급역산</button>
          <button className={`tab-btn ${tab === 'guide' ? 'active' : ''}`} onClick={() => setTab('guide')}>등급안내</button>
        </div>
      </div>

      <div className="content">

        {/* ───── 탭1: 과목 등급 계산기 ───── */}
        {tab === 'grade' && (
          <>
            <div className="card">
              <p className="card-label">내 석차 입력</p>
              <div className="input-group">
                <label className="input-label">수강 인원 (전체)</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 280" value={total} onChange={e => { setTotal(e.target.value); setGradeResult(null); }} />
              </div>
              <div className="input-group">
                <label className="input-label">내 석차</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 35" value={rank} onChange={e => { setRank(e.target.value); setGradeResult(null); }} />
              </div>
              <div className="input-group">
                <label className="input-label">동점자 수 (나 포함, 없으면 1)</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 1" value={tied} onChange={e => { setTied(e.target.value); setGradeResult(null); }} />
              </div>
              <button className="calc-btn" onClick={handleCalcGrade}>등급 계산하기</button>
            </div>

            <div className={`result-box ${gradeResult ? gradeClass(gradeResult.grade) : 'neutral'}`}>
              {gradeResult ? (
                <>
                  <div className="result-grade-label">내신 등급</div>
                  <div className="result-grade-num">{gradeResult.grade}</div>
                  <div className="result-achievement">
                    성취도 <strong>{calcAchievement(gradeResult.percentile)}</strong>
                  </div>
                  <div className="result-percentile">
                    석차 백분율 {gradeResult.percentile.toFixed(2)}%
                  </div>
                </>
              ) : (
                <>
                  <div className="result-grade-num">-</div>
                  <div className="result-grade-label">정보를 입력하고 계산해 주세요</div>
                </>
              )}
            </div>
          </>
        )}

        {/* ───── 탭2: 교과 평균 계산기 ───── */}
        {tab === 'avg' && (
          <>
            <div className="card">
              <p className="card-label">과목 입력</p>
              <div className="subject-header">
                <span>과목명</span>
                <span>등급</span>
                <span>단위수</span>
                <span></span>
              </div>
              <div className="subject-list">
                {subjects.map(s => (
                  <div className="subject-row" key={s.id}>
                    <input
                      className="subject-input"
                      placeholder="과목명"
                      value={s.name}
                      onChange={e => updateSubject(s.id, 'name', e.target.value)}
                    />
                    <select className="subject-select" value={s.grade} onChange={e => updateSubject(s.id, 'grade', e.target.value)}>
                      {[1,2,3,4,5].map(g => <option key={g} value={g}>{g}등급</option>)}
                    </select>
                    <input
                      className="subject-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="4"
                      value={s.unit}
                      onChange={e => updateSubject(s.id, 'unit', e.target.value)}
                      style={{ textAlign: 'center' }}
                    />
                    <button className="remove-btn" onClick={() => removeSubject(s.id)}>×</button>
                  </div>
                ))}
              </div>
              <button className="add-btn" onClick={addSubject}>+ 과목 추가</button>
              <button className="calc-btn" onClick={handleCalcAvg}>평균 등급 계산하기</button>
            </div>

            <div className="card">
              <p className="card-label">계산 결과</p>
              <div className="avg-result">
                <span className="avg-label">단위수 가중 평균 등급</span>
                <span className="avg-value">{avgResult !== null ? avgResult.toFixed(2) : '-'}</span>
              </div>
            </div>
          </>
        )}

        {/* ───── 탭3: 역산 계산기 ───── */}
        {tab === 'reverse' && (
          <>
            <div className="card">
              <p className="card-label">현재 내 상황</p>
              <div className="input-group">
                <label className="input-label">수강 인원 (전체)</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 280" value={rTotal} onChange={e => { setRTotal(e.target.value); setReverseResult(null); }} />
              </div>
              <div className="input-group">
                <label className="input-label">현재 내 석차</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 35" value={rRank} onChange={e => { setRRank(e.target.value); setReverseResult(null); }} />
              </div>
              <div className="input-group">
                <label className="input-label">동점자 수 (나 포함)</label>
                <input className="input-field" type="number" inputMode="numeric" placeholder="예) 1" value={rTied} onChange={e => { setRTied(e.target.value); setReverseResult(null); }} />
              </div>
            </div>

            <div className="card">
              <p className="card-label">목표 등급 선택</p>
              <div className="target-grade-grid">
                {[1,2,3,4,5].map(g => (
                  <button key={g} className={`tg-btn ${targetGrade === g ? 'selected' : ''}`} onClick={() => { setTargetGrade(g); setReverseResult(null); }}>{g}등급</button>
                ))}
              </div>
              <button className="calc-btn" onClick={handleCalcReverse}>계산하기</button>
            </div>

            {reverseResult && (
              reverseResult.need <= 0 ? (
                <div className="reverse-result-card">
                  <div className="already-there">🎉 이미 {reverseResult.target}등급!</div>
                  <div className="reverse-sub">현재 {reverseResult.current}등급입니다</div>
                </div>
              ) : (
                <div className="reverse-result-card">
                  <div className="reverse-main">{reverseResult.need}명</div>
                  <div className="reverse-sub">을 앞질러야 {reverseResult.target}등급</div>
                  <div className="info-row">
                    <span className="info-key">현재 등급</span>
                    <span className="info-val danger">{reverseResult.current}등급</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">목표 등급</span>
                    <span className="info-val accent">{reverseResult.target}등급</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">{reverseResult.target}등급 컷 (인원 기준)</span>
                    <span className="info-val">{calcTargetRank(parseInt(rTotal), reverseResult.target)}등 이내</span>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* ───── 탭4: 등급 안내 ───── */}
        {tab === 'guide' && (
          <>
            <div className="card">
              <p className="card-label">5등급제 컷 기준</p>
              <table className="grade-table">
                <thead>
                  <tr>
                    <th>등급</th>
                    <th>성취도</th>
                    <th>석차 백분율</th>
                    <th>상위 %</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [1,'A','0 ~ 10%','10%'],
                    [2,'B','10 ~ 34%','34%'],
                    [3,'C','34 ~ 66%','66%'],
                    [4,'D','66 ~ 90%','90%'],
                    [5,'E','90 ~ 100%','100%'],
                  ].map(([g,a,r,t]) => (
                    <tr key={g}>
                      <td><span className={`grade-badge gb${g}`}>{g}</span></td>
                      <td>{a}</td>
                      <td style={{ fontFamily: 'DM Mono', fontSize: 12 }}>{r}</td>
                      <td style={{ color: '#9090b0' }}>{t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <p className="card-label">과목 유형별 평가 방식</p>
              <div className="type-card">
                <div className="type-card-title">공통과목 / 일반선택 <span className="type-tag tag-rel">상대평가</span></div>
                <div className="type-card-desc">석차 5등급 + 성취도(A~E) 병기. 수능 주요 과목이 대부분 해당.</div>
              </div>
              <div className="type-card">
                <div className="type-card-title">진로선택과목 <span className="type-tag tag-abs">절대평가</span></div>
                <div className="type-card-desc">성취도(A~E)만 기재. 석차 등급 없음. 내신 평균 계산 시 별도 처리 필요.</div>
              </div>
              <div className="type-card">
                <div className="type-card-title">체육·예술·교양·융합선택 <span className="type-tag tag-abs">절대평가</span></div>
                <div className="type-card-desc">성취도만 기재. 등급 자체가 없음. 일반 내신 평균에 포함되지 않음.</div>
              </div>
            </div>

            <div className="disclaimer">
              ⚠️ 이 계산기는 일반적인 고교학점제 기준을 적용합니다. 학교별·과목별 세부 기준은 다를 수 있으니 반드시 담임 선생님 또는 학교 성적 담당 교사에게 확인하세요.
            </div>
          </>
        )}

      </div>
    </div>
  );
}
