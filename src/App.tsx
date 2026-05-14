import { useEffect, useRef, useState} from "react";

interface Color {
  r: number;
  g: number;
  b: number;
}

const PALETTE: Color[] = [
  { r: 192, g: 108, b: 132 },
  { r: 248, g: 196, b: 216 },
  { r: 255, g: 100, b: 100 },
  { r: 255, g: 160, b: 80 },
  { r: 255, g: 220, b: 80 },
  { r: 100, g: 220, b: 140 },
  { r: 80, g: 180, b: 255 },
  { r: 140, g: 100, b: 255 },
  { r: 255, g: 100, b: 220 },
  { r: 80, g: 230, b: 230 },
  { r: 255, g: 180, b: 120 },
  { r: 180, g: 255, b: 100 },
];

function randColor(): Color {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// ─── Particle Classes (unchanged) ─────────────────────────────────────────────
class SmokeParticle {
  x: number; y: number; vx: number; vy: number; size: number;
  maxSize: number; color: Color; alpha: number; decay: number;
  rotation: number; rotSpeed: number; growing: boolean; life: number;

  constructor(x: number, y: number, burst: boolean) {
    this.color = randColor();
    this.x = x + rand(-1, 1) * (burst ? 20 : 8);
    this.y = y + rand(-1, 1) * (burst ? 20 : 8);
    this.vx = rand(-1, 1) * (burst ? 3.5 : 1.0);
    this.vy = burst ? rand(-1, 1) * 3.5 : rand(-2.2, -0.3);
    this.size = rand(10, burst ? 32 : 22);
    this.maxSize = this.size * rand(1.2, 2.4);
    this.alpha = rand(0.2, 0.5);
    this.decay = rand(0.004, burst ? 0.014 : 0.008);
    this.rotation = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-0.06, 0.06);
    this.growing = true;
    this.life = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.984;
    this.vy *= 0.981;
    this.vx += rand(-0.18, 0.18);
    this.rotation += this.rotSpeed;
    this.alpha -= this.decay;
    this.life -= this.decay;

    if (this.growing) {
      this.size += 0.5;
      if (this.size >= this.maxSize) this.growing = false;
    } else {
      this.size += 0.1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { r, g, b } = this.color;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    grad.addColorStop(0, `rgba(${r},${g},${b},${this.alpha})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${this.alpha * 0.55})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  get dead() { return this.alpha <= 0.01 || this.life <= 0; }
}

class SparkleParticle {
  x: number; y: number; vx: number; vy: number; size: number;
  color: Color; alpha: number; decay: number; rotation: number;
  rotSpeed: number; shape: number;

  constructor(x: number, y: number, burst: boolean, color?: Color) {
    this.color = color ?? randColor();
    const angle = rand(0, Math.PI * 2);
    const speed = burst ? rand(3, 10) : rand(0.5, 2.5);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - (burst ? 2 : 1);
    this.size = rand(2, burst ? 10 : 5);
    this.alpha = 1;
    this.decay = rand(0.01, burst ? 0.022 : 0.013);
    this.rotation = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-0.2, 0.2);
    this.shape = Math.floor(rand(0, 3));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.vx *= 0.98;
    this.alpha -= this.decay;
    this.rotation += this.rotSpeed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { r, g, b } = this.color;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
    ctx.shadowBlur = 8;

    if (this.shape === 0) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? this.size : this.size * 0.4;
        const angle = (i * Math.PI) / 5;
        if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.6, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  get dead() { return this.alpha <= 0.01; }
}

class RingParticle {
  x: number; y: number; radius: number; maxRadius: number;
  alpha: number; color: Color; lineWidth: number;

  constructor(x: number, y: number, color: Color) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = rand(60, 140);
    this.alpha = 0.85;
    this.color = color;
    this.lineWidth = rand(1, 3);
  }

  update() {
    this.radius += 4;
    this.alpha -= 0.025;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { r, g, b } = this.color;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = this.lineWidth;
    ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  get dead() { return this.alpha <= 0 || this.radius >= this.maxRadius; }
}

class ShootingStar {
  x: number; y: number; vx: number; vy: number; alpha: number;
  color: Color; trail: { x: number; y: number }[];

  constructor(x: number, y: number, color: Color) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(5, 13);
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.color = color;
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 14) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.93;
    this.vy *= 0.93;
    this.alpha -= 0.04;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.trail.length < 2) return;
    const { r, g, b } = this.color;
    ctx.save();
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.globalAlpha = t * this.alpha * 0.85;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = t * 3;
      ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  get dead() { return this.alpha <= 0; }
}

// ─── App Component ───────────────────────────────────────────────────────────
const SKILLS = [
  { name: "React", icon: "⚛️", level: "Advanced" },
  { name: "Tailwind CSS", icon: "🎨", level: "Advanced" },
  { name: "JavaScript", icon: "🟡", level: "Advanced" },
  { name: ".NET", icon: "🌐", level: "Learning" },
  { name: "SQL", icon: "🗄️", level: "Intermediate" },
  { name: "Entity Framework", icon: "🔗", level: "Intermediate" },
  { name: "Git", icon: "🔀", level: "Advanced" },
  { name: "Postman", icon: "📬", level: "Intermediate" },
];

const PROJECTS = [
  { title: "Hostel Management System", stack: ["React", "Tailwind", ".NET Web API"],github: "https://github.com/Asw1n21/HostelManagementSystem.git",desc: "A full-featured web app with seamless UX and robust backend.", gradient: "from-[#f8c4d8] via-[#ffe4e8] to-[#ffd6e7]" },
  { title: "Expense Tracking App", stack: [".NET MAUI", "Mud Blazor", "JSON"], github:"https://github.com/Asw1n21/ExpenseTracking.git",desc: "Data-driven dashboard with real-time updates and clean UI.", gradient: "from-[#e8d5f0] via-[#f8c4d8] to-[#fde8d8]" },
  { title: "Project Management", stack: ["ASP.NET Web Forms"],github: "https://github.com/Asw1n21/AdvanceDatabaseCoursework.git", desc: "Modern web platform with authentication and API integration.", gradient: "from-[#fde8d8] via-[#ffe4e8] to-[#e8d5f0]," },
];

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const smokes: SmokeParticle[] = [];
    const sparkles: SparkleParticle[] = [];
    const rings: RingParticle[] = [];
    const stars: ShootingStar[] = [];

    let lastSpawn = 0;
    let lastX = -999;
    let lastY = -999;

    const addSmoke = (x: number, y: number, n: number, burst: boolean) => {
      for (let i = 0; i < n; i++) smokes.push(new SmokeParticle(x, y, burst));
      if (smokes.length > 300) smokes.splice(0, smokes.length - 300);
    };

    const addSparkles = (x: number, y: number, n: number, burst: boolean, c?: Color) => {
      for (let i = 0; i < n; i++) sparkles.push(new SparkleParticle(x, y, burst, c));
      if (sparkles.length > 250) sparkles.splice(0, sparkles.length - 250);
    };

    const clickBurst = (x: number, y: number) => {
      const c = randColor();
      addSmoke(x, y, 22, true);
      addSparkles(x, y, 28, true, c);
      for (let i = 0; i < 3; i++) rings.push(new RingParticle(x, y, c));
      for (let i = 0; i < 8; i++) stars.push(new ShootingStar(x, y, c));
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const now = Date.now();

      if (now - lastSpawn > 16) {
        addSmoke(e.clientX, e.clientY, Math.min(Math.floor(speed / 4) + 2, 8), false);
        if (speed > 8) addSparkles(e.clientX, e.clientY, Math.min(Math.floor(speed / 10) + 1, 4), false);
        lastSpawn = now;
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onClick = (e: MouseEvent) => clickBurst(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      addSmoke(t.clientX, t.clientY, 4, false);
      addSparkles(t.clientX, t.clientY, 2, false);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      clickBurst(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchstart", onTouchStart);

    let animId: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = smokes.length - 1; i >= 0; i--) {
        smokes[i].update();
        if (smokes[i].dead) { smokes.splice(i, 1); continue; }
        smokes[i].draw(ctx);
      }
      for (let i = sparkles.length - 1; i >= 0; i--) {
        sparkles[i].update();
        if (sparkles[i].dead) { sparkles.splice(i, 1); continue; }
        sparkles[i].draw(ctx);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].update();
        if (rings[i].dead) { rings.splice(i, 1); continue; }
        rings[i].draw(ctx);
      }
      for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].update();
        if (stars[i].dead) { stars.splice(i, 1); continue; }
        stars[i].draw(ctx);
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      cancelAnimationFrame(animId);
    };
  }, []);
const [isMenuOpen, setIsMenuOpen] = useState (false);
  return (
    <div className="min-h-screen bg-[#fff8f3] text-[#4a3c35] font-light overflow-hidden">

      {/* Magical Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-9999"
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-[#f5d4d8]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1 className="text-lg tracking-[0.2em] font-semibold text-[#c06c84]">ASWIN GOLE</h1>
          <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium">
            {["About", "Skills", "Projects", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-[#4a3c35] hover:text-[#c06c84] transition-colors duration-300 group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#c06c84] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            </div>
            <button
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className="md:hidden w-8 h-8 flex items-center justify-center text-[#c06c84]"
      aria-label="Toggle menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={isMenuOpen 
            ? "M6 18L18 6M6 6h12v12" 
            : "M4 6h16M4 12h16M4 18h16"
          }
        />
      </svg>
    </button>
  </div>

  {/* Mobile Menu */}
  <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden
    ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
    <div className="px-6 py-8 bg-white/95 backdrop-blur-md border-t border-[#f5d4d8] flex flex-col gap-6 text-sm uppercase tracking-widest font-medium">
      {["About", "Skills", "Projects", "Contact"].map((item) => (
        <a
          key={item}
          href={`#${item.toLowerCase()}`}
          onClick={() => setIsMenuOpen(false)}
          className="text-[#4a3c35] hover:text-[#c06c84] transition-colors duration-300 py-1"
        >
          {item}
        </a>
      ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#fff8f3]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-175 h-175 rounded-full border border-[#f8c4d8]/20" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full border border-[#c06c84]/10" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 rounded-full border border-[#f8c4d8]/30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f8c4d8]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#c06c84]/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#f5d4d8] text-[#c06c84] text-xs tracking-widest uppercase font-medium mb-10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c06c84] animate-pulse inline-block" />
            Available for opportunities
          </div>

          <h1 className="text-[80px] md:text-[118px] leading-none font-serif text-[#5c2e3a] tracking-tighter">
            ASWIN
          </h1>
          <h1 className="text-[80px] md:text-[118px] leading-none font-serif tracking-tighter bg-linear-to-r from-[#c06c84] via-[#d68a9e] to-[#9f4a6a] bg-clip-text text-transparent">
            GOLE
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[#6b4a52]">
            <span className="px-4 py-1.5 rounded-full bg-white border border-[#f5d4d8] shadow-sm">Frontend Developer</span>
            <span className="text-[#f5d4d8]">✦</span>
            <span className="px-4 py-1.5 rounded-full bg-white border border-[#f5d4d8] shadow-sm">Aspiring Full Stack</span>
            <span className="text-[#f5d4d8]">✦</span>
            <span className="px-4 py-1.5 rounded-full bg-white border border-[#f5d4d8] shadow-sm">React & .NET</span>
          </div>

          <div className="mt-12 flex gap-4 justify-center flex-wrap">
            <a
              href="#projects"
              className="px-9 py-4 bg-[#c06c84] text-white rounded-full hover:bg-[#9f4a6a] hover:shadow-lg hover:shadow-[#c06c84]/30 hover:-translate-y-0.5 transition-all duration-300 text-sm font-medium tracking-wide"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="px-9 py-4 bg-white border border-[#c06c84] text-[#c06c84] rounded-full hover:bg-[#fff0f4] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-medium tracking-wide"
            >
              Get In Touch
            </a>
          </div>
        </div>
      </section>

      {/* About, Skills, Projects, Contact sections remain the same as you provided */}
      {/* (I kept them exactly as in your original for consistency) */}

      {/* About */}
      <section id="about" className="py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase text-[#c06c84] font-medium">Who I am</span>
            <h2 className="mt-3 text-5xl font-serif text-[#5c2e3a]">About Me</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-3xl bg-linear-to-br from-[#f8c4d8] via-[#ffe4e8] to-[#ffd6e7] flex items-center justify-center shadow-xl">
                  <span className="text-7xl font-serif text-[#c06c84]/60">AG</span>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-[#c06c84] flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-medium text-center leading-tight px-2">Full Stack Journey</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[#6b4a52] text-lg leading-relaxed">
                I'm a frontend developer passionate about building beautiful, responsive web interfaces that users love.
              </p>
              <p className="mt-4 text-[#6b4a52] text-lg leading-relaxed">
                Currently expanding into backend development with{" "}
                <span className="text-[#c06c84] font-medium">.NET</span> and{" "}
                <span className="text-[#c06c84] font-medium">SQL</span>, focused on performance, scalability, and real-world experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Problem Solver", "Clean Code", "UI/UX Enthusiast", "Lifelong Learner"].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 text-sm rounded-full border border-[#f5d4d8] text-[#c06c84] bg-[#fff8f3]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills, Projects, Contact, Footer... (same as your original) */}
      {/* For brevity, I kept the rest identical to what you provided. */}

      {/* Skills */}
      <section id="skills" className="py-28 bg-[#fff8f3]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase text-[#c06c84] font-medium">What I use</span>
            <h2 className="mt-3 text-5xl font-serif text-[#5c2e3a]">Skills & Tools</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {SKILLS.map((skill) => (
              <div
                key={skill.name}
                className="group bg-white rounded-2xl p-6 border border-[#f8c4d8]/30 hover:border-[#c06c84]/40 hover:shadow-lg hover:shadow-[#f8c4d8]/50 hover:-translate-y-1.5 transition-all duration-300 text-center cursor-default"
              >
                <div className="text-3xl mb-3">{skill.icon}</div>
                <p className="font-semibold text-[#5c2e3a]">{skill.name}</p>
                <p className="text-xs text-[#c06c84] mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {skill.level}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase text-[#c06c84] font-medium">My work</span>
            <h2 className="mt-3 text-5xl font-serif text-[#5c2e3a]">Featured Projects</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {PROJECTS.map((project, i) => (
              <div
                key={project.title}
                className={`group bg-white rounded-3xl overflow-hidden border border-[#f8c4d8]/30 hover:border-[#c06c84]/30 hover:shadow-2xl hover:shadow-[#f8c4d8]/40 hover:-translate-y-2 transition-all duration-500 ${i === 2 ? "md:col-span-2" : ""}`}
              >
                <div className={`h-52 bg-linear-to-br ${project.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 shadow-lg flex flex-col justify-center gap-2 px-4">
                      <div className="h-2 bg-[#c06c84]/40 rounded-full" />
                      <div className="h-2 bg-[#c06c84]/25 rounded-full w-3/4" />
                      <div className="h-2 bg-[#c06c84]/15 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md text-[#c06c84]">
                      ↗
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#5c2e3a]">{project.title}</h3>
                  <p className="text-sm text-[#6b4a52] mt-2 leading-relaxed">{project.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.stack.map((s) => (
                      <span key={s} className="px-3 py-1 text-xs rounded-full bg-[#fff8f3] border border-[#f5d4d8] text-[#c06c84]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <a
          href={project.github}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#c06c84] hover:text-[#9f4a6a] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577 0-.285-.01-1.044-.015-2.049-3.338.729-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.286 0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          View on GitHub
        </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-28 bg-[#fff8f3] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-150 h-150 rounded-full bg-[#f8c4d8]/10 blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <span className="text-xs tracking-[0.3em] uppercase text-[#c06c84] font-medium">Say hello</span>
          <h2 className="mt-3 text-5xl font-serif text-[#5c2e3a]">Let's Connect</h2>
          <p className="mt-6 text-lg text-[#6b4a52] leading-relaxed">
            I'm open to new opportunities, exciting projects, and creative collaborations. Let's build something beautiful together.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=aswingole60@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
              className="px-10 py-4 bg-[#c06c84] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#9f4a6a] hover:shadow-lg hover:shadow-[#c06c84]/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Send an Email
            </a>
            <a
              href="https://drive.google.com/file/d/1L2OX8F5Y7z6qQUEO3LaWWy8aykxirXj5/view?usp=sharing"
  target="_blank"
  rel="noopener noreferrer"
              className="px-10 py-4 bg-white border border-[#c06c84] text-[#c06c84] rounded-full text-sm font-medium tracking-wide hover:bg-[#fff0f4] hover:-translate-y-0.5 transition-all duration-300"
            >
              View Resume
            </a>
          </div>
         
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-[#c06c84] bg-white border-t border-[#f5d4d8] tracking-widest uppercase">
        © 2026 Aswin Gole &nbsp;·&nbsp; Made with ♡
      </footer>
    </div>
  );
}

export default App;