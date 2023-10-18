import { Component, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject, timer, Subscription, fromEvent, merge } from 'rxjs';
import { switchMap, tap, takeUntil, buffer, debounceTime, filter } from 'rxjs/operators';

/**
 * AppComponent provides a stopwatch functionality.
 * The user can start, stop, wait, and reset the stopwatch.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnDestroy, AfterViewInit {
  title = 'stopwatch-angular';

  /** Subjects for various user interactions */
  private start$ = new Subject<void>();
  private stop$ = new Subject<void>();
  private doubleClick$ = new Subject<void>();

  /** Array to store all active subscriptions for clean up */
  private subscriptions: Subscription[] = [];
  
  isRunning = false;
  startButtonText = 'Start';
  secondsPassed = 0;
  formattedTime = '00:00:00';

  /**
  * Timer observable that emits every second.
  * Stops emitting when either stop$ or doubleClick$ emits.
  */
  private interval$ = timer(0, 1000).pipe(
    takeUntil(merge(this.stop$, this.doubleClick$)), 
    tap(() => this.updateTime())
  );

   /**
   * Constructor initializes necessary properties and subscribes to the timer.
   * 
   * @param el ElementRef service to access DOM elements
   * @param datePipe DatePipe service for formatting the displayed time
   */ 
  constructor(private el: ElementRef, private datePipe: DatePipe) {
    this.start$.pipe(switchMap(() => this.interval$)).subscribe();
  }

  /**
   * Update the stopwatch display based on seconds passed.
   */
  private updateTime(): void {
    this.secondsPassed++;
    const date = new Date(0, 0, 0, 0, Math.floor(this.secondsPassed / 60), this.secondsPassed % 60);
    const time = this.datePipe.transform(date, 'HH:mm:ss');
    if (time) {
      this.formattedTime = time;
    }
  }

  /**
   * After view initialization, setup event listeners for user interactions.
   */
  ngAfterViewInit(): void {
    const startButton = this.el.nativeElement.querySelector('button[startButton]');
    const resetButton = this.el.nativeElement.querySelector('button[resetButton]');
    const waitButton = this.el.nativeElement.querySelector('button[waitButton]');

    this.subscriptions.push(
      fromEvent(startButton, 'click').subscribe(() => {
        if (this.isRunning) {
          this.stop$.next();
          this.isRunning = false;
          this.startButtonText = 'Start';
        } else {
          this.start$.next();
          this.isRunning = true;
          this.startButtonText = 'Stop';
        }
      })
    );

    this.subscriptions.push(
      fromEvent(resetButton, 'click').subscribe(() => {
        this.secondsPassed = 0;
        this.formattedTime = '00:00:00';
        this.stop$.next();
        this.isRunning = false;
        this.startButtonText = 'Start';
      })
    );

    const click$ = fromEvent(waitButton, 'click');
    this.subscriptions.push(
      click$.pipe(
        buffer(click$.pipe(debounceTime(300))),
        filter(events => events.length === 2),
        tap(() => {
          this.doubleClick$.next();
          this.isRunning = false;
          this.startButtonText = 'Start';
        })
      ).subscribe()
    );
  }
  
  /**
   * On component destruction, unsubscribe from all active subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
}