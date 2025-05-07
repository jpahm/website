export class Filesystem {
    resolvePath = function(path) {
        const isAbsolute = path.startsWith('/');
        const pathSegments = path.trim().split('/');
    
        // Start with working directory if the path is relative
        const stack = isAbsolute ? [] : this.workingDir.split('/').filter(Boolean);
    
        for (const segment of pathSegments) {
            if (segment === '' || segment === '.') {
                // Ignore empty segments and current directory
                continue;
            } else if (segment === '..') {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(segment);
            }
        }
    
        return '/' + stack.join('/');
    }
    constructor() {
        this.workingDir = '/';
    }
}