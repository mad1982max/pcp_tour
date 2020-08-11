
let clusterize = function (points, baseDistance){
    function Vector2(x,y){
        this.x = x;
        this.y = y;
        this.distanceTo = function(otherVector){
            if (!otherVector) throw 'NullPointerException';
            if (!(otherVector instanceof Vector2)) throw 'wrong type!';
            const dx = this.x - otherVector.x;
            const dy = this.y - otherVector.y;
            return Math.sqrt( dx * dx + dy * dy );
        };
        this.add = function(otherVector){
            if (!otherVector) throw 'NullPointerException';
            if (!(otherVector instanceof Vector2)) throw 'wrong type!';
            this.x += otherVector.x;
            this.y += otherVector.y;
            return this;
        };
        this.subtract = function(otherVector){
            if (!otherVector) throw 'NullPointerException';
            if (!(otherVector instanceof Vector2)) throw 'wrong type!';
            this.x -= otherVector.x;
            this.y -= otherVector.y;
            return this;
        };
        this.lengthSquared = function(){
            return this.x * this.x + this.y * this.y;
        };
        this.length = function(){
            return Math.sqrt(this.lengthSquared());
        };
        this.scalarDivide = function(scalar){
            this.x /= scalar;
            this.y /= scalar;
            return this;
        };
        this.scalarMultiply = function(scalar){
            this.x *= scalar;
            this.y *= scalar;
            return this;
        };
        this.copy = function(){
            return new Vector2(this.x, this.y);
        };
    }
    function Cluster(firstPoint){
        this.points = [firstPoint];
        this.centroid = firstPoint.position.copy();
        this.recalculateCentroid = function(){
            this.centroid = this.points.reduce(function(accumulator, currentValue){
                return accumulator.add(currentValue.position);
            }, new Vector2(0, 0)).scalarDivide(this.points.length);
            return this.centroid;
        };
        this.addPoint = function(point){
            this.centroid.scalarMultiply(this.points.length).add(point.position).scalarDivide(this.points.length+1);
            this.points.push(point);
        };
    }

    const clusters = [];
    const distances = {};
    const distanceFromCount = function(count){
        let d = distances[count];
        if (d) return d;

        d = baseDistance;// * Math.pow(1.1, count-2);
        d = d * d; // squared
        distances[count] = d;
        return d;
    };

    points.forEach(function(point){point.position = new Vector2(point.x_img, point.y_img);});

    points.forEach(function(point, index){
        if (!point) return;

        let newCluster = new Cluster(point);
        points[index] = null;
        points.forEach(function (point, index){
            if (!point) return;
            const distance = newCluster.centroid.copy().subtract(point.position).lengthSquared();
            if (distance < distanceFromCount(newCluster.points.length)){
                newCluster.addPoint(point);
                points[index] = null;
            }
        });
        clusters.push(newCluster);
    });
    return clusters;
}

