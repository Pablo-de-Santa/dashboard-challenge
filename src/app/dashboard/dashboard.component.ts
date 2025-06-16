import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { AreaChartComponent } from "../components/area-chart/area-chart.component";
import { BarChartComponent } from "../components/bar-chart/bar-chart.component";
import { CustomChartComponent } from "../components/custom-chart/custom-chart.component";
import { Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [AreaChartComponent, BarChartComponent, CustomChartComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild("emojiBg", { static: false })
  emojiBgRef!: ElementRef<HTMLDivElement>;
  private readonly emojis = ["💰","💸","💵","💴","💶","💷","🪙","🤑","💲","💳","🧾","🏦","💹","💱","₿"];
  private activeEmojis: HTMLElement[] = [];
  private containerWidth = 0;
  private containerHeight = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.emojiBgRef?.nativeElement;
    if (!container) {
      return;
    }

    this.containerWidth = container.offsetWidth;
    this.containerHeight = container.offsetHeight;
    setTimeout(() => {
      this.startEmojiAnimation();
    }, 200);

    window.addEventListener("resize", this.onResize);
  }

  ngOnDestroy(): void {
    this.activeEmojis.forEach((emoji) => emoji.remove());
    this.activeEmojis = [];
  }

  private startEmojiAnimation(): void {
    const container = this.emojiBgRef?.nativeElement;
    if (!container) return;

    for (let i = 0; i < 70; i++) {
      const emoji = document.createElement("div");
      emoji.classList.add("emoji");
      emoji.textContent =
        this.emojis[Math.floor(Math.random() * this.emojis.length)];

      const size = Math.random() * 1.5 + 1;
      const opacity = Math.random() * 0.5 + 0.5;
      const startX = Math.random() * this.containerWidth;
      const startY = Math.random() * this.containerHeight;
      const velocityX = (Math.random() - 0.5) * 2;
      const velocityY = (Math.random() - 0.5) * 3;

      Object.assign(emoji.style, {
        left: `${startX}px`,
        top: `${startY}px`,
        fontSize: `${size}rem`,
        opacity: opacity,
        position: "absolute",
        transform: "translate(-50%, -50%)",
      });

      container.appendChild(emoji);
      this.activeEmojis.push(emoji);
      this.animateEmoji(emoji, velocityX, velocityY);
    }
  }

  private animateEmoji(
    emoji: HTMLElement,
    velocityX: number,
    velocityY: number
  ): void {
    let x = parseFloat(emoji.style.left);
    let y = parseFloat(emoji.style.top);
    const size = parseFloat(emoji.style.fontSize) * 16;
    const halfSize = size / 2;

    const updatePosition = () => {
      x += velocityX;
      y += velocityY;

      if (x <= halfSize || x >= this.containerWidth - halfSize) {
        velocityX *= -1;
        x = Math.max(halfSize, Math.min(this.containerWidth - halfSize, x));
      }

      if (y <= halfSize || y >= this.containerHeight - halfSize) {
        velocityY *= -1;
        y = Math.max(halfSize, Math.min(this.containerHeight - halfSize, y));
      }

      emoji.style.left = `${x}px`;
      emoji.style.top = `${y}px`;

      if (this.activeEmojis.includes(emoji)) {
        requestAnimationFrame(updatePosition);
      }
    };

    requestAnimationFrame(updatePosition);
  }

  private onResize = () => {
    if (!this.emojiBgRef?.nativeElement) return;
    this.containerWidth = this.emojiBgRef.nativeElement.offsetWidth;
    this.containerHeight = this.emojiBgRef.nativeElement.offsetHeight;

    this.activeEmojis.forEach((emoji) => {
      const x = Math.random() * this.containerWidth;
      const y = Math.random() * this.containerHeight;
      emoji.style.left = `${x}px`;
      emoji.style.top = `${y}px`;
    });
  };
}
