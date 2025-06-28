'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, Shield, Star, ThumbsUp } from 'lucide-react';
import { Badge } from '~/components/ui/badge';

interface PropertyReviewsSectionProps {
  propertyId: string;
  averageRating?: number;
  totalReviews?: number;
  className?: string;
}

export function PropertyReviewsSection({
  averageRating = 0,
  totalReviews = 0,
  className = '',
}: PropertyReviewsSectionProps) {
  // Mock data for demonstration
  const mockReviews = [
    {
      id: '1',
      author: 'Sarah M.',
      rating: 5,
      date: '2024-01-15',
      comment:
        'Amazing property with stunning views! The host was very responsive and the place was exactly as described.',
      verified: true,
      helpful: 12,
    },
    {
      id: '2',
      author: 'Mike R.',
      rating: 4,
      date: '2024-01-10',
      comment: 'Great location and clean space. Would definitely stay again.',
      verified: true,
      helpful: 8,
    },
    {
      id: '3',
      author: 'Emma L.',
      rating: 5,
      date: '2024-01-05',
      comment:
        'Perfect for our family vacation. The amenities were top-notch and the neighborhood was very safe.',
      verified: true,
      helpful: 15,
    },
  ];

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            {renderStars(averageRating, 'md')}
            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        </div>

        {/* Blockchain Badge */}
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          On-chain Verified
        </Badge>
      </div>

      {/* Rating Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Rating Breakdown</h3>
        <div className="space-y-3 overflow-hidden">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = rating === 5 ? 45 : rating === 4 ? 12 : rating === 3 ? 3 : 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2 w-full">
                <span className="text-sm w-3 flex-shrink-0 text-center">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-6 flex-shrink-0 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {mockReviews.length > 0 ? (
          mockReviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">{review.author.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.author}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-3">{review.comment}</p>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Reply
                </Button>
              </div>
            </Card>
          ))
        ) : (
          /* Placeholder for no reviews */
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to leave a review for this property. All reviews are verified on the
                  blockchain for transparency and trust.
                </p>
                <Badge variant="outline" className="flex items-center gap-2 w-fit mx-auto">
                  <Shield className="w-4 h-4" />
                  Blockchain-verified reviews coming soon
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Load More Button */}
      {mockReviews.length > 0 && (
        <div className="text-center">
          <Button variant="outline">Load More Reviews</Button>
        </div>
      )}

      {/* Future Features Notice */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Blockchain-Verified Reviews
            </h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              All reviews on StellarRent will be stored on the Stellar blockchain, ensuring they
              cannot be manipulated or deleted. This provides complete transparency and trust in the
              review system.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
