/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
  Label,
} from 'recharts';
import { bin } from 'd3-array';
import { 
  RefreshCw, 
  Play, 
  RotateCcw, 
  Users, 
  TrendingUp, 
  BarChart3,
  Info,
  Settings2,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const POPULATION_SIZE = 3000;
const BIN_COUNT = 20;
const MIN_SALARY = 2000;
const MAX_SALARY = 25000;
const SAMPLE_SIZE_OPTIONS = [50, 100, 200, 500, 1000];
const SAMPLING_COUNT_OPTIONS = [10, 50, 100, 500, 1000];

// --- Utilities ---
const generatePopulation = () => {
  const data = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    // Log-normal distribution for salaries
    // mean around 8000, standard deviation around 4000
    // Using Box-Muller transform for normal, then exp for log-normal
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    
    // Adjusting parameters to get a realistic range
    // ln(8000) is approx 8.98
    const salary = Math.exp(8.9 + z0 * 0.4); 
    data.push(Math.max(MIN_SALARY, Math.min(MAX_SALARY, Math.round(salary))));
  }
  return data;
};

const getBins = (data: number[], domain: [number, number], count: number) => {
  const binner = bin<number, number>()
    .domain(domain)
    .thresholds(count);
  const bins = binner(data);
  return bins.map((b) => ({
    x0: b.x0,
    x1: b.x1,
    count: b.length,
    label: `${Math.round(b.x0! / 1000)}k`,
  }));
};

export default function App() {
  // --- State ---
  const [population, setPopulation] = useState<number[]>([]);
  const [sampleSize, setSampleSize] = useState(500);
  const [samplingCount, setSamplingCount] = useState(100);
  const [currentSample, setCurrentSample] = useState<number[]>([]);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);
  const [isSampling, setIsSampling] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

  // --- Initialization ---
  useEffect(() => {
    setPopulation(generatePopulation());
  }, []);

  // --- Derived Data ---
  const populationStats = useMemo(() => {
    if (population.length === 0) return null;
    const mean = population.reduce((a, b) => a + b, 0) / population.length;
    const variance = population.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / population.length;
    return { mean, stdDev: Math.sqrt(variance) };
  }, [population]);

  const sampleStats = useMemo(() => {
    if (currentSample.length === 0) return null;
    const mean = currentSample.reduce((a, b) => a + b, 0) / currentSample.length;
    const variance = currentSample.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / currentSample.length;
    return { mean, stdDev: Math.sqrt(variance) };
  }, [currentSample]);

  const populationBins = useMemo(() => {
    if (population.length === 0) return [];
    return getBins(population, [MIN_SALARY, MAX_SALARY], BIN_COUNT);
  }, [population]);

  const sampleBins = useMemo(() => {
    if (currentSample.length === 0) return [];
    return getBins(currentSample, [MIN_SALARY, MAX_SALARY], BIN_COUNT);
  }, [currentSample]);

  const meansBins = useMemo(() => {
    if (sampleMeans.length === 0) return [];
    // Domain for means should be narrower than the population domain
    const minMean = Math.min(...sampleMeans) * 0.95;
    const maxMean = Math.max(...sampleMeans) * 1.05;
    return getBins(sampleMeans, [minMean, maxMean], 15);
  }, [sampleMeans]);

  // --- Handlers ---
  const handleSingleSample = () => {
    setIsSampling(true);
    // Simulate a small delay for "dynamic" feel
    setTimeout(() => {
      const shuffled = [...population].sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, sampleSize);
      setCurrentSample(sample);
      setIsSampling(false);
    }, 400);
  };

  const handleMultipleSamples = async (count: number) => {
    setIsSampling(true);
    const newMeans: number[] = [];
    
    // We'll do it in chunks to avoid blocking the UI too much and show progress
    for (let i = 0; i < count; i++) {
      const shuffled = [...population].sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, sampleSize);
      const mean = sample.reduce((a, b) => a + b, 0) / sampleSize;
      newMeans.push(mean);
      
      if (i % 10 === 0) {
        setSampleMeans(prev => [...prev, ...newMeans.splice(0)]);
        await new Promise(r => setTimeout(r, 20));
      }
    }
    setSampleMeans(prev => [...prev, ...newMeans]);
    setIsSampling(false);
  };

  const handleReset = () => {
    setCurrentSample([]);
    setSampleMeans([]);
  };

  const handleRegeneratePopulation = () => {
    setPopulation(generatePopulation());
    handleReset();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">毕业生起薪抽样演示</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              通过动态抽样演示统计学核心概念。观察从总体（3000人）中抽取样本（500人）时，样本分布与总体分布的异同，以及多次抽样后均值的分布规律。
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRegeneratePopulation}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            >
              <RefreshCw size={16} className={isSampling ? "animate-spin" : ""} />
              重置总体
            </button>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">总体 (Population)</span>
              <Users className="text-blue-500" size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{POPULATION_SIZE}人</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">平均月薪:</span>
                  <span className="font-mono font-semibold">¥{populationStats?.mean.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">标准差:</span>
                  <span className="font-mono">¥{populationStats?.stdDev.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">单次样本 (Sample)</span>
              <BarChart3 className="text-emerald-500" size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{sampleSize}人</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">样本均值:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {sampleStats ? `¥${sampleStats.mean.toFixed(0)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">样本标准差:</span>
                  <span className="font-mono">
                    {sampleStats ? `¥${sampleStats.stdDev.toFixed(0)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">抽样分布 (Sampling Dist.)</span>
              <TrendingUp className="text-purple-500" size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{sampleMeans.length}次抽样</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">均值的均值:</span>
                  <span className="font-mono font-semibold text-purple-600">
                    {sampleMeans.length > 0 ? `¥${(sampleMeans.reduce((a,b)=>a+b,0)/sampleMeans.length).toFixed(0)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">标准误 (SE):</span>
                  <span className="font-mono">
                    {sampleMeans.length > 1 ? `¥${Math.sqrt(sampleMeans.reduce((a,b)=>a+Math.pow(b-(sampleMeans.reduce((x,y)=>x+y,0)/sampleMeans.length),2),0)/sampleMeans.length).toFixed(0)}` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Controls & Charts */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'single' ? 'bg-slate-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              单次抽样对比
            </button>
            <button 
              onClick={() => setActiveTab('multiple')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'multiple' ? 'bg-slate-50 text-purple-600 border-b-2 border-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              多次抽样分布 (CLT)
            </button>
          </div>

          <div className="p-8">
            {/* Sample Size Control */}
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Settings2 size={20} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">调整样本量 (n):</span>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  {SAMPLE_SIZE_OPTIONS.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setSampleSize(size);
                        handleReset();
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sampleSize === size ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-400 max-w-xs text-center md:text-right">
                样本量越大，样本均值通常越接近总体均值，抽样分布的波动（标准误）越小。
              </div>
            </div>

            {activeTab === 'single' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info size={16} />
                    <span className="text-sm">观察样本分布是否能较好地还原总体分布的形状。</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-2"
                    >
                      <RotateCcw size={16} /> 清除
                    </button>
                    <button 
                      disabled={isSampling}
                      onClick={handleSingleSample}
                      className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play size={16} fill="currentColor" /> 抽取{sampleSize}人
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Population Chart */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full" />
                      总体分布 (N=3000)
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={populationBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          {populationStats && (
                            <ReferenceLine x={Math.floor((populationStats.mean - MIN_SALARY) / ((MAX_SALARY - MIN_SALARY) / BIN_COUNT))} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2}>
                              <Label value="总体均值" position="top" fill="#ef4444" fontSize={10} fontWeight="bold" />
                            </ReferenceLine>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sample Chart */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                      样本分布 (n={sampleSize})
                    </h3>
                    <div className="h-[300px] w-full relative">
                      {currentSample.length === 0 && !isSampling && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 z-10">
                          <p className="text-slate-400 font-medium">点击上方按钮开始抽样</p>
                        </div>
                      )}
                      <AnimatePresence>
                        {isSampling && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <RefreshCw className="animate-spin text-blue-600" size={32} />
                              <span className="text-blue-600 font-bold animate-pulse">正在随机抽样...</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sampleBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                          {populationStats && (
                            <ReferenceLine x={Math.floor((populationStats.mean - MIN_SALARY) / ((MAX_SALARY - MIN_SALARY) / BIN_COUNT))} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2}>
                              <Label value="总体均值" position="top" fill="#ef4444" fontSize={10} fontWeight="bold" />
                            </ReferenceLine>
                          )}
                          {sampleStats && (
                            <ReferenceLine x={Math.floor((sampleStats.mean - MIN_SALARY) / ((MAX_SALARY - MIN_SALARY) / BIN_COUNT))} stroke="#10b981" strokeWidth={2}>
                              <Label value="样本均值" position="top" fill="#10b981" fontSize={10} fontWeight="bold" />
                            </ReferenceLine>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Mean Comparison Section */}
                {sampleStats && populationStats && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 p-6 rounded-3xl border border-blue-100"
                  >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          <ArrowRightLeft className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-lg">均值对比</h4>
                          <p className="text-sm text-slate-500">观察单次随机抽样的误差 (Sampling Error)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">总体均值</div>
                          <div className="text-2xl font-mono font-bold text-slate-900">¥{populationStats.mean.toFixed(0)}</div>
                        </div>
                        <div className="text-slate-300 text-2xl font-light">−</div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">样本均值</div>
                          <div className="text-2xl font-mono font-bold text-emerald-600">¥{sampleStats.mean.toFixed(0)}</div>
                        </div>
                        <div className="text-slate-300 text-2xl font-light">=</div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-1">抽样误差</div>
                          <div className={`text-2xl font-mono font-bold ${Math.abs(populationStats.mean - sampleStats.mean) > 500 ? 'text-orange-500' : 'text-blue-600'}`}>
                            ¥{Math.abs(populationStats.mean - sampleStats.mean).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Info size={16} />
                    <span className="text-sm">中心极限定理：无论总体分布如何，样本均值的分布趋向于正态分布。</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-500">次数:</span>
                      <select 
                        value={samplingCount}
                        onChange={(e) => setSamplingCount(Number(e.target.value))}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        {SAMPLING_COUNT_OPTIONS.map(count => (
                          <option key={count} value={count}>{count}次</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-2"
                    >
                      <RotateCcw size={16} /> 清除
                    </button>
                    <button 
                      disabled={isSampling}
                      onClick={() => handleMultipleSamples(samplingCount)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Play size={16} fill="currentColor" /> 开始抽样
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-6 bg-purple-500 rounded-full" />
                      样本均值的分布 (Sampling Distribution of Means)
                    </h3>
                    <div className="h-[400px] w-full relative">
                      {sampleMeans.length === 0 && !isSampling && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 z-10">
                          <p className="text-slate-400 font-medium">点击上方按钮进行多次抽样</p>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={meansBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorMeans" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="x0" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fill: '#94a3b8' }} 
                            tickFormatter={(v) => `¥${Math.round(v)}`}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(v) => `均值区间: ¥${Math.round(v)}`}
                          />
                          <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMeans)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                    <h4 className="font-bold text-slate-800">统计学观察</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">1. 分布形状</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          即使总体分布是右偏的（Log-normal），随着抽样次数增加，样本均值的分布会越来越接近<strong>正态分布</strong>。
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">2. 期望值</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          样本均值的平均值（¥{(sampleMeans.reduce((a,b)=>a+b,0)/(sampleMeans.length || 1)).toFixed(0)}）非常接近总体均值（¥{populationStats?.mean.toFixed(0)}）。
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">3. 波动性与样本量</p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          当前样本量 <strong>n={sampleSize}</strong>。样本量越大，均值的分布范围越窄（标准误 SE 越小），这意味着抽样结果越稳定。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="text-center text-slate-400 text-sm pb-12">
          <p>© 2026 统计学教育演示工具 · 模拟数据基于对数正态分布</p>
        </footer>
      </div>
    </div>
  );
}
