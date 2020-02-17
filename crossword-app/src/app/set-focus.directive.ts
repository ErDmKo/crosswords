import {
    Directive,
    Input,
    ElementRef,
    Renderer,
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
        private renderer: Renderer,
        private cdRef: ChangeDetectorRef
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (this.isFocused) {
            this.renderer.invokeElementMethod(
                this.hostElement.nativeElement,
                'focus'
            );
            this.cdRef.detectChanges();
        }
    }
}
