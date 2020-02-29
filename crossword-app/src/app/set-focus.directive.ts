import {
    Directive,
    Input,
    ElementRef,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
} from '@angular/core';

@Directive({
    selector: '[appSetFocus]',
})
export class SetFocusDirective implements OnChanges {
    @Input('appSetFocus') isFocused: boolean;

    constructor(
        private hostElement: ElementRef,
        private cdRef: ChangeDetectorRef
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (this.isFocused) {
            this.hostElement.nativeElement.focus();
            this.cdRef.detectChanges();
        }
    }
}
