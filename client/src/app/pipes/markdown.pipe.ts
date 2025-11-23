import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'markdown',
    standalone: true
})
export class MarkdownPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string): SafeHtml {
        if (!value) return '';

        let html = value
            // Bold headers: **Text** -> <h4 ...>Text</h4>
            .replace(/\*\*(.*?)\*\*/g, '<h4 class="text-indigo-900 font-bold mt-4 mb-2 text-base">$1</h4>')
            // List items: * Text -> <li ...>Text</li>
            .replace(/^\* (.*$)/gm, '<li class="flex items-start gap-2 mb-2 text-slate-700"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span><span>$1</span></li>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
