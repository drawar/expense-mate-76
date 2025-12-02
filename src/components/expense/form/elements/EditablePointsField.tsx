import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CoinsIcon } from 'lucide-react';

interface EditablePointsFieldProps {
  calculatedValue: number;
  pointsCurrency: string;
  isEditMode?: boolean;
}

export const EditablePointsField: React.FC<EditablePointsFieldProps> = ({
  calculatedValue,
  pointsCurrency,
  isEditMode = false,
}) => {
  const form = useFormContext();
  const rewardPoints = form.watch('rewardPoints');
  const error = form.formState.errors.rewardPoints;

  return (
    <div className="space-y-2">
      <Label htmlFor="rewardPoints" className="flex items-center gap-2">
        <CoinsIcon className="h-4 w-4" />
        Reward Points
      </Label>
      
      <Input
        id="rewardPoints"
        type="text"
        placeholder="0.00"
        {...form.register('rewardPoints')}
        className={error ? 'border-red-500' : ''}
      />
      
      {error && (
        <p className="text-sm text-red-500">
          {error.message as string}
        </p>
      )}
      
      <p className="text-sm text-muted-foreground">
        Calculated: {calculatedValue.toLocaleString()} {pointsCurrency}
      </p>
    </div>
  );
};

export default EditablePointsField;
