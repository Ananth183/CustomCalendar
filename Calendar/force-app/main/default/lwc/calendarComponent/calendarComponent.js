import { LightningElement, track } from 'lwc';
import getEventsByDateRange from '@salesforce/apex/CalendarController.getEventsByDateRange';

export default class CalendarComponent extends LightningElement {
    @track currentMonth;
    @track daysInMonth = [];
    @track startDate;
    @track endDate;
    @track selectedEvent = null;
    @track isModalOpen = false;
    @track timeZone = 'NZ'; // Default to NZ time zone
    @track currentTimeZone = 'NZST'; // To display on UI


    @track selectedEventStartTimeLocal;
    @track selectedEventEndTimeLocal;
    connectedCallback() {
        this.initializeMonth();
        this.loadEvents();
    }

    initializeMonth() {
        const today = new Date();
        this.setMonthRange(today);
        this.updateMonthGrid();
    }

    setMonthRange(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        this.startDate = start;
        this.endDate = end;
        this.currentMonth = start.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    updateMonthGrid(events = []) {
        const days = [];
        const monthStartDay = this.startDate.getDay();
        const totalDays = this.endDate.getDate();

        for (let i = 0; i < monthStartDay; i++) {
            days.push({ date: null, dayNumber: null, events: [] });
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), day);
            const dayEvents = this.getEventsForDay(date, events);
            days.push({ date: date.toDateString(), dayNumber: day, events: dayEvents });
        }

        this.daysInMonth = days;
    }

    getEventsForDay(date, events) {
        return events.filter(event => {
            const startDate = new Date(event.Start_Date__c);
            const endDate = new Date(event.End_Date__c);
            return date >= startDate && date <= endDate;
        });
    }

    loadEvents() {
        getEventsByDateRange({ startDate: this.startDate, endDate: this.endDate })
            .then(data => {
                this.updateMonthGrid(data);
            })
            .catch(error => {
                console.error('Error loading events', error);
            });
    }

    handlePreviousMonth() {
        const prevMonth = new Date(this.startDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        this.setMonthRange(prevMonth);
        this.loadEvents();
    }

    handleNextMonth() {
        const nextMonth = new Date(this.startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        this.setMonthRange(nextMonth);
        this.loadEvents();
    }

    handleEventClick(event) {
        const selectedEventId = event.currentTarget.dataset.id;
        this.selectedEvent = this.daysInMonth.flatMap(day => day.events).find(evt => evt.Id === selectedEventId);
        this.convertTimes();
        this.isModalOpen = true;
    }

    convertTimes() {
        if (this.selectedEvent) {
            const startTimeUTC = new Date(this.selectedEvent.Start_Date__c);
            const endTimeUTC = new Date(this.selectedEvent.End_Date__c);
            const offsetHours = this.timeZone === 'NZ' ? 0 : 5.5;
            this.selectedEventStartTimeLocal = this.convertToTimeZone(startTimeUTC, offsetHours);
            this.selectedEventEndTimeLocal = this.convertToTimeZone(endTimeUTC, offsetHours);
        }
    }

    convertToTimeZone(date, offsetHours) {
        const offsetMillis = offsetHours * 60 * 60 * 1000;
        const newDate = new Date(date.getTime() + offsetMillis);
        return newDate.toLocaleString();
    }

    toggleTimeZone() {
        this.timeZone = this.timeZone === 'NZ' ? 'IST' : 'NZ';
        this.currentTimeZone = this.timeZone === 'NZ' ? 'NZST' : 'IST';
        this.convertTimes();
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedEvent = null;
    }
}