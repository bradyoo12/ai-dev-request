using System.ComponentModel.DataAnnotations;

namespace AiDevRequest.API.Entities;

public class VoiceConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    /// <summary>
    /// Voice recognition language (e.g. "en-US", "ko-KR")
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Language { get; set; } = "en-US";

    /// <summary>
    /// Enable continuous dictation mode (long-form voice input)
    /// </summary>
    public bool ContinuousMode { get; set; } = true;

    /// <summary>
    /// Enable auto-punctuation for transcribed text
    /// </summary>
    public bool AutoPunctuate { get; set; } = true;

    /// <summary>
    /// Enable text-to-speech feedback for AI responses
    /// </summary>
    public bool TtsEnabled { get; set; } = false;

    /// <summary>
    /// TTS voice name preference
    /// </summary>
    [MaxLength(100)]
    public string? TtsVoice { get; set; }

    /// <summary>
    /// TTS speech rate (0.5 - 2.0)
    /// </summary>
    public double TtsRate { get; set; } = 1.0;

    /// <summary>
    /// JSON array of voice transcription history entries
    /// </summary>
    public string? TranscriptionHistoryJson { get; set; }

    /// <summary>
    /// Total number of voice sessions
    /// </summary>
    public int SessionCount { get; set; } = 0;

    /// <summary>
    /// Total seconds of voice input recorded
    /// </summary>
    public int TotalDurationSeconds { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
