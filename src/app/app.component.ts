import { Component, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
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

  public isRunning: boolean = false;
  public secondsPassed: number = 0;

  /** Subjects for various user interactions */
  private start$ = new Subject<void>();
  private stop$ = new Subject<void>();
  private doubleClick$ = new Subject<void>();
  /** Array to store all active subscriptions for clean up */
  private subscriptions: Subscription[] = [];
  
  /**
  * Timer observable that emits every second.
  * Stops emitting when either stop$ or doubleClick$ emits.
  */
  private interval$ = timer(0, 1000).pipe(
    takeUntil(merge(this.stop$, this.doubleClick$)), 
    tap(() => this.secondsPassed++)
  );

   /**
   * Constructor initializes necessary properties and subscribes to the timer.
   * 
   * @param el ElementRef service to access DOM elements
   */ 
  constructor(private el: ElementRef) {
    this.start$.pipe(switchMap(() => this.interval$)).subscribe();
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
        } else {
          this.start$.next();
          this.isRunning = true;
        }
      })
    );

    this.subscriptions.push(
      fromEvent(resetButton, 'click').subscribe(() => {
        this.secondsPassed = 0;
        this.stop$.next();
        this.isRunning = false;
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