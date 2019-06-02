import { 
    Directive,
    Input,
    ElementRef,
    Renderer,
    OnChanges,
    SimpleChanges
} from '@angular/core';

@Directive({
    selector: '[appSetFocus]'
})
export class SetFocusDirective implements OnChanges {
    @Input('appSetFocus') isFocused: boolean;

    constructor(
        private hostElement: ElementRef,
        private renderer: Renderer
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (this.isFocused) {
            this.renderer.invokeElementMethod(this.hostElement.nativeElement, 'focus');
        }
    }
}
